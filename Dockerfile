FROM node:14-slim
RUN mkdir -p /usr/app/

WORKDIR /usr/app/nest-reservafrac-backend
COPY . . 
RUN npm install
EXPOSE 2001
CMD ["node","dist/main.js"]
