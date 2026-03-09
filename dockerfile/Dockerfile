# Create environments that will be same for everyone's device
# Runs server.js to everyone

FROM node:16

# Defines working directory of a docker file
# Any command will be executed in this working directory
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install 

# First dot: copy everything from source folder
# Second dot: to the working directory of docker container
COPY . . 

# Documents the ports that the docer is expected to listen on when it's ran 
EXPOSE 3000

CMD ["npm","run","dev"]