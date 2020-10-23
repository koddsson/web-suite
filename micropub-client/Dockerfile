FROM hayd/deno:1.0.0

WORKDIR /usr/src/app

COPY . .

# These are passed as deno arguments when run with docker:
CMD ["run", "--allow-read", "--allow-write", "--allow-net", "--allow-env", "src/index.ts"]
