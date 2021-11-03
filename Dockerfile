FROM node:14
COPY dist dist
ENTRYPOINT [ "node", "/dist/js/node/main.js" ]
