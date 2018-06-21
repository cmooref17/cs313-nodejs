git add *

echo "Commit description"
read message
git commit -m "$message"
git push heroku master

$SHELL