FROM node:8-alpine
# allow node to bind port 80 regardless of uid
RUN apk add --no-cache libcap git && setcap cap_net_bind_service=+ep /usr/local/bin/node
WORKDIR /usr/local/opt/backend/
ENTRYPOINT ["sh","-c", "\
  nslookup db >/dev/null 2>&1 || { echo 'db lookup error'; exit 1; };\
  echo -n 'waiting for db ';\
  for i in $(seq 1 60); do echo -n '.'; timeout -t 1 nc -z db 27017 && s=0 && break || s=$?; sleep 1; done; [ \"$s\" -ne \"0\" ] && { echo 'db connection timeout'; exit $s; };\
  echo ' ready';\
  node_modules/.bin/mocha --opts mocha.opts;\
"]
ENV NODE_ENV=test LABEL_CONFIG=development TS_NODE_FILES=true TEST=true
COPY ["package.json", "yarn.lock", "tsconfig.json", "tslint.json", "mocha.opts", "./"]
RUN ["yarn", "install"]
COPY ["./src/", "/usr/local/opt/backend/src/"]
