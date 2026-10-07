#!/usr/bin/env bash
set -euo pipefail

image="${MONGO_TEST_IMAGE:-mongo:7.0}"
container_id=""
next_pid=""
cleanup() {
  if [[ -n "$next_pid" ]]; then kill "$next_pid" >/dev/null 2>&1 || true; wait "$next_pid" >/dev/null 2>&1 || true; fi
  if [[ -n "$container_id" ]]; then docker rm -f "$container_id" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT INT TERM

if ! docker image inspect "$image" >/dev/null 2>&1; then
  printf 'Imagem de teste %s nao esta local; sem download automatico.\n' "$image" >&2
  exit 1
fi

container_id="$(docker run --rm -d --publish 127.0.0.1:27018:27017 "$image" --replSet rs0 --bind_ip_all)"
ready=0
for _ in $(seq 1 60); do
  if docker exec "$container_id" mongosh --quiet --eval 'db.adminCommand({ ping: 1 }).ok' >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then printf '%s\n' 'MongoDB descartavel nao iniciou.' >&2; exit 1; fi

docker exec "$container_id" mongosh --quiet --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })' >/dev/null
ready=0
for _ in $(seq 1 60); do
  if docker exec "$container_id" mongosh --quiet --eval 'db.hello().isWritablePrimary' | rg -q '^true$'; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then printf '%s\n' 'MongoDB descartavel nao e PRIMARY.' >&2; exit 1; fi

export MONGODB_TEST_URI='mongodb://127.0.0.1:27018/erp_souza_integration_test?replicaSet=rs0&directConnection=true'
export MONGODB_URI="$MONGODB_TEST_URI"
export ERP_INTEGRATION_RUN_ID="$(cat /proc/sys/kernel/random/uuid)"
container_mongodb_uri='mongodb://127.0.0.1:27017/erp_souza_integration_test?replicaSet=rs0&directConnection=true'
export AUTH_SECRET='integration-test-secret-with-at-least-32-bytes'
export STORE_TEST_BASE_URL='http://127.0.0.1:3011'
docker exec "$container_id" mongosh --quiet "$container_mongodb_uri" --eval "db.getCollection('_erp_integration_runner').insertOne({_id:'container-runner',runId:'$ERP_INTEGRATION_RUN_ID'})" >/dev/null
pnpm exec tsx --test tests/mongodb-index-rehearsal.test.ts
pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3011 >/tmp/erp-souza-next-integration.log 2>&1 &
next_pid="$!"
ready=0
for _ in $(seq 1 90); do
  if curl --silent --output /dev/null "$STORE_TEST_BASE_URL/api/auth/me"; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then
  sed -n '1,240p' /tmp/erp-souza-next-integration.log >&2
  printf '%s\n' 'Next de integracao nao iniciou.' >&2
  exit 1
fi

pnpm exec tsx --test tests/mongodb-test-target.test.ts tests/shared-store-http.integration.test.ts
pnpm exec tsx scripts/migrate-store-scope.ts --uri-env MONGODB_TEST_URI --database erp_souza_integration_test >/tmp/erp-souza-migration-dry-run.json
