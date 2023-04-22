FROM node:14-slim
RUN mkdir -p /usr/app/

WORKDIR /usr/app/sadaye
COPY . . 
RUN npm install
EXPOSE 3000
CMD ["node","dist/main.js"]
