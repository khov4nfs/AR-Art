#!/usr/bin/env bash
# Production handoff: no source edits, no seeding, no docker volume deletion.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${EVERIE_ENV_FILE:-$ROOT/deploy/.env}"
COMPOSE_FILE="$ROOT/deploy/docker-compose.vps.yml"
umask 077

usage() {
  echo "Usage: deploy/production.sh check|backup|deploy|smoke|rollback <backup-dir>" >&2
  echo "Set EVERIE_ENV_FILE if deploy/.env is kept outside this repo." >&2
}

if [[ $# -lt 1 ]]; then usage; exit 2; fi
ACTION="$1"
if [[ "$ACTION" != check && "$ACTION" != backup && "$ACTION" != deploy &&
      "$ACTION" != smoke && "$ACTION" != rollback ]]; then usage; exit 2; fi
if [[ ! -f "$ENV_FILE" ]]; then echo "Missing deploy/.env (copy deploy/.env.production.example)." >&2; exit 3; fi
ENV_FILE="$(realpath "$ENV_FILE")"
if [[ "$(stat -c %a "$ENV_FILE")" != 600 ]]; then
  echo "Private env must be chmod 600: $ENV_FILE" >&2; exit 3
fi

command -v docker >/dev/null || { echo "Docker CLI missing." >&2; exit 3; }
command -v node >/dev/null || { echo "Node.js >=22 required for preflight." >&2; exit 3; }
command -v python3 >/dev/null || { echo "Python 3 required for preflight." >&2; exit 3; }
export EVERIE_RUNTIME_ENV_FILE="$ENV_FILE"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
"${COMPOSE[@]}" config --quiet

cd "$ROOT"
# The validator consumes resolved Compose JSON (including runtime env-file values)
# without exposing the secrets in stdout, log files, or command arguments.
"${COMPOSE[@]}" config --format json | node deploy/verify-production.mjs

# These values only come from the validated Compose configuration.
mapfile -t VALUES < <("${COMPOSE[@]}" config --format json | node -e '
let s="";process.stdin.on("data",x=>s+=x).on("end",()=>{
const c=JSON.parse(s),v=c.services.web.volumes,n=Array.isArray(c.services.web.networks)?c.services.web.networks[0]:Object.keys(c.services.web.networks)[0];
console.log(v.find(x=>x.target==="/app/data").source);
console.log(v.find(x=>x.target==="/app/public/uploads").source);
console.log(c.services.web.container_name);
console.log(c.networks[n].name);
console.log(c.services.web.environment.SITE_URL);
});')
DATA_DIR="${VALUES[0]}"
UPLOAD_DIR="${VALUES[1]}"
CONTAINER="${VALUES[2]}"
NETWORK="${VALUES[3]}"
SITE_URL="${VALUES[4]}"
docker network inspect "$NETWORK" >/dev/null
docker info >/dev/null

if docker container inspect "$CONTAINER" >/dev/null 2>&1; then
  # Reuse EXACTLY the same existing production volumes, never point the upgrade
  # at a different CMS, sign-in DB or media directory.
  docker container inspect "$CONTAINER" --format '{{json .Mounts}}' |
    node -e 'let s="";process.stdin.on("data",x=>s+=x).on("end",()=>{
      const mounts=JSON.parse(s);
      for(const [dest,expected] of [["/app/data",process.argv[1]],["/app/public/uploads",process.argv[2]]]){
        const m=mounts.find(x=>x.Destination===dest);
        if(!m || m.Source!==expected){ console.error("Existing container mount mismatch: "+dest);process.exitCode=4; }
      }
    });' "$DATA_DIR" "$UPLOAD_DIR"
fi

if [[ "$ACTION" == check ]]; then
  echo "READY: Existing EVERIE CMS, shared session config, media mounts and network verified."
  exit 0
fi

smoke() {
  local path expected code
  for path in /api/health / /gallery /ar /login; do
    code="$(docker exec "$CONTAINER" node -e \
      'fetch("http://127.0.0.1:3000"+process.argv[1]).then(r=>process.stdout.write(String(r.status))).catch(()=>process.stdout.write("000"))' \
      "$path")"
    if [[ "$code" != 200 ]]; then
      echo "FAIL internal HTTP $code $path" >&2
      return 1
    fi
  done
  for path in /api/auth/me /api/ar/collection /api/studio/products; do
    code="$(docker exec "$CONTAINER" node -e \
      'fetch("http://127.0.0.1:3000"+process.argv[1]).then(r=>process.stdout.write(String(r.status))).catch(()=>process.stdout.write("000"))' \
      "$path")"
    if [[ "$code" != 401 ]]; then
      echo "FAIL anonymous access $code $path" >&2
      return 1
    fi
  done
  # The public HTTPS endpoint also verifies reverse-proxy routing and site config.
  for path in /api/health /gallery /ar /login; do
    code="$(curl -LsS --max-time 20 -o /dev/null -w '%{http_code}' "$SITE_URL$path")"
    if [[ "$code" != 200 ]]; then
      echo "FAIL public HTTPS $code $path" >&2
      return 1
    fi
  done
  echo "SMOKE_OK: public HTTPS, CMS, AR and anonymous auth checks passed."
}

if [[ "$ACTION" == smoke ]]; then smoke; exit; fi

BACKUP_ROOT="${EVERIE_BACKUP_ROOT:-/opt/everievn/backups}"
backup() {
  local dir
  mkdir -p -m 700 "$BACKUP_ROOT"
  dir="$(mktemp -d "$BACKUP_ROOT/handoff-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXXXX")"
  chmod 700 "$dir"
  echo "Backing up current private CMS/AR registry and all uploaded media."
  tar -C "$DATA_DIR" -czf "$dir/data.tar.gz" .
  tar -C "$UPLOAD_DIR" -czf "$dir/uploads.tar.gz" .
  (cd "$dir" && sha256sum data.tar.gz uploads.tar.gz > SHA256SUMS)
  echo "$dir"
}

if [[ "$ACTION" == backup ]]; then backup; exit; fi

if [[ "$ACTION" == rollback ]]; then
  if [[ $# -ne 2 || ! -f "$2/previous-image.txt" ]]; then usage; exit 2; fi
  IMAGE="$(cat "$2/previous-image.txt")"
  if [[ ! "$IMAGE" =~ ^everievn-web:rollback-[0-9]{8}T[0-9]{6}Z$ ]]; then
    echo "Invalid rollback image tag." >&2; exit 5
  fi
  docker image inspect "$IMAGE" >/dev/null
  EVERIE_IMAGE="$IMAGE" "${COMPOSE[@]}" up -d --no-deps --force-recreate --wait --wait-timeout 180 web
  smoke
  echo "ROLLED_BACK_TO=$IMAGE (uploaded CMS/media were not changed by this command)"
  exit 0
fi

# 'deploy' always saves an isolated rollback image and a filesystem backup.
BACKUP="$(backup | tail -1)"
OLD_IMAGE_ID=""
if docker container inspect "$CONTAINER" >/dev/null 2>&1; then
  OLD_IMAGE_ID="$(docker container inspect "$CONTAINER" --format '{{.Image}}')"
fi
if [[ -n "$OLD_IMAGE_ID" ]]; then
  TAG="everievn-web:rollback-$(date -u +%Y%m%dT%H%M%SZ)"
  docker image tag "$OLD_IMAGE_ID" "$TAG"
  printf '%s\n' "$TAG" > "$BACKUP/previous-image.txt"
fi

UPGRADE_STARTED=0
restore_on_failure() {
  # Failed image builds leave the old running container untouched.
  if [[ "$UPGRADE_STARTED" == 1 && -n "$OLD_IMAGE_ID" && -f "$BACKUP/previous-image.txt" ]]; then
    echo "Deploy failed. Recreating previous container from preserved image..." >&2
    EVERIE_IMAGE="$(cat "$BACKUP/previous-image.txt")" \
      "${COMPOSE[@]}" up -d --no-deps --force-recreate --wait --wait-timeout 180 web || true
  fi
}
trap restore_on_failure ERR

echo "Building the integrated EVERIE + AR image (GLB pipeline unchanged)..."
"${COMPOSE[@]}" build web
UPGRADE_STARTED=1
"${COMPOSE[@]}" up -d --no-deps --force-recreate --wait --wait-timeout 180 web
smoke
trap - ERR
echo "DEPLOY_OK: $SITE_URL"
echo "BACKUP_DIR=$BACKUP"
echo "No source edits, no changed login provider, no data volume deletion."
