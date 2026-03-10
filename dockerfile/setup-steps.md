# Setup for Database

## TLDR of the idea for the database
Utilized docker containers for everyone to have the same database in their local devices
* basically these are just lightweight VMs that contain executables to ensure program runs consistently in any environment

## Setup steps
1. Install Docker
    * [Download link for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
2. Run Docker and login
    * Any account will do
    * Make sure to run docker in the background
3. Install **Rest Client by Huanchao Mao** in VSCode extensions
    * Used to run .rest files that simulate HTTP requests
4. Download .env file that was sent in Messenger GC
    * Make sure to put the .env file inside the dockerfile folder
5. Run command `docker build -t shiitake .`
6. Run command `docker-compose up --build`
7. To stop the containers: Press `Ctrl + C` + `q`
8. (Optional) To shut everything down and clean up, run `docker-compose down`
    * This is when things get buggy

## Testing
1. Open `test.rest`
2. Wait until this shows:
    * app-1  | Server has started on port: 3000
    * app-1  | ✅ All models were synchronized successfully.
2. Run the `GET` commands by clicking *"Send request"*
    * Gets the entries in the tables
3. Run `POST` command by clicking *"Send request"*
    * Adds entries to the table

## Notes
1. The initial setup will take a few minutes as Docker downloads the official PostgreSQL image. Subsequent starts will be nearly instant.
2. Database data is saved locally on your machine
    * Will implement something to have a consistent database throughout machines

## Reference
[Youtube Video](https://www.youtube.com/watch?v=sDPw2Yp4JwE)