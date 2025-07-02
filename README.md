# Quickstart

1. Set up a poetry environment with Python 3.13 as its interpreter. In Pycharm it is under "Add new interpreter -> Add
   local interpreter"
2. Install dependencies with `poetry install`
3. Install frontend dependencies with `pnpm install` (pnpm is faster than npm :) )
4. Create a settings.py file in soldera/settings/, you can use the example file as its base.

5. There are multiple options when it comes to database:
    - a If you're using PyCharm, you can just start the Local Database from Run Configuration (Local PostgreSQL
      Database)
    - b Alternatively, run `docker compose -f .\docker-compose-local.yml up` to start a local database.
    - c Another option is to use SQLite, by uncommenting the relevant DATABASES section from settings.py (if you use
      example as the base)

6. Run React + Django + Db Worker
7. Open the command line inside the Poetry environment and run `python manage.py migrate`
8. Open the project at localhost:3001
9. (Optional) run `python manage.py populate_auctions_from_json varia\migration-data.json` to add some historical
   auction data to database.

# Deployment

1. Create conf folder in the root of the project (this is git ignored).
2. Create Certificate and Private Key for deployment in `conf` folder.
4. Run `docker build -f .\docker-compose.yml`.

   NB! Current solution does not handle multiple settings, as of 01.07.2025 the solution is to rename settings.py to
   something else once done with development,
   and to move settings_prod.py in its place.

5. Once the image is built it can be deployed.
6. Run the application on the server using docker-compose or podman-compose.
7. On the initial run, you must create the database `python manage.py migrate`, for that you'll have to
   `docker exec -it <container_id> bash`, navigate to `\app\soldera` and activate venv with `source venv\bin\activate`

*Project Requirements*: Python 3.13+, Poetry, pnpm, Node, Docker/Podman, Docker/Podman Compose.
