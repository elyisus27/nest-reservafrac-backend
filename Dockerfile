#npm run build
#docker build . -t jesus2787/nest-reservafrac:latest
FROM node:18-slim
RUN mkdir -p /usr/app/

WORKDIR /usr/app/nest-reservafrac-backend
COPY . . 
RUN npm install
EXPOSE 2001
CMD ["node","dist/main.js"]
