# no-pain-no-main: Vigil Service


This repo contains the back-end code for our App, which is located
in our [Client Repo](https://github.com/calvin-cs262-fall2024-no-pain-no-main/Client)

Our back-end is hosted at https://no-pain-no-main.azurewebsites.net/

It is based on the Azure App Service tutorial [here](https://learn.microsoft.com/en-us/azure/app-service/quickstart-nodejs?tabs=linux&pivots=development-environment-cli)

We have a relational database that is being hosted on [PostgreSQL](https://www.postgresql.org/). We have added endpoints to implement
CRUD operations so that the client can make changes to the database. We used cURL to locally test these endpoints

This repo has been configured so that when we update the main branch, our Azure App Service will auto-deploy.

Here are a few of our read data route URLs:
* ```/``` The default route
* ```/exercises``` Returns a list of exercises
* ```/quizzes``` Returns all quizzes
* ```/customworkout:id``` Returns a list of workouts that the user made
* ```/workout:id/exerciseData``` Returns a list of exercises in a specific workout

Many of our routes are posts, puts, or deletes. If we have any gets, most of them return a lot of data at once -- but when we are modifying or deleting the data, we need to do so in small increments.


Our project deliverables due at each sprint can be found in our [Project Repo](https://github.com/calvin-cs262-fall2024-no-pain-no-main/Project).
