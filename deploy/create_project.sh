#!/usr/bin/env bash
# Prerequisites: jq, firebase, gcloud, npm are installed
set -euxo pipefail

if ! [ -x "$(command -v firebase)" ]; then
  echo 'Error: firebase is not installed.' >&2
  exit 1
fi

if ! [ -x "$(command -v jq)" ]; then
  echo 'Error: jq is not installed.' >&2
  exit 1
fi

if ! [ -x "$(command -v gcloud)" ]; then
  echo 'Error: gcloud is not installed.' >&2
  exit 1
fi

if ! [ -x "$(command -v npm)" ]; then
  echo 'Error: npm is not installed.' >&2
  exit 1
fi

CURRENT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "${CURRENT_PATH}/./config.sh"

if [ -d "${CURRENT_PATH}/barnard-language-learning-app" ];
  then rm -Rf ${CURRENT_PATH}/barnard-language-learning-app; fi

gcloud auth login

if [ -z "${GCP_FOLDER_ID}" ]
then
  if [ -z "${GCP_ORG_ID}" ]
  then
    gcloud projects create ${GCP_LANGUAGE_PROJECT_ID} \
      --name ${GCP_LANGUAGE_PROJECT_ID} --set-as-default
  else
    gcloud projects create ${GCP_LANGUAGE_PROJECT_ID} \
      --name ${GCP_LANGUAGE_PROJECT_ID} --set-as-default \
      --organization ${GCP_ORG_ID}
  fi
else
  gcloud projects create ${GCP_LANGUAGE_PROJECT_ID} \
    --name ${GCP_LANGUAGE_PROJECT_ID} --set-as-default \
    --folder ${GCP_FOLDER_ID}
fi


PROJECT_ID="$(gcloud config list --format 'value(core.project)')"

gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable cloudbilling.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable serviceusage.googleapis.com
gcloud services enable firebase.googleapis.com
gcloud services enable credentials.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable appengine.googleapis.com
gcloud services enable firebasehosting.googleapis.com
gcloud services enable sheets.googleapis.com
gcloud services enable vision.googleapis.com

gcloud beta billing projects link ${PROJECT_ID} \
  --billing-account ${GCP_BILLING_ACCOUNT_ID}

gcloud auth application-default login --client-id-file=$CLIENT_ID_FILE \
  --scopes="https://www.googleapis.com/auth/cloud-platform, https://www.googleapis.com/auth/firebase"

BEARER_ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"

curl --request POST -H "Authorization: Bearer $BEARER_ACCESS_TOKEN" \
  "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}:addFirebase"
sleep 20
curl --request POST -H "Authorization: Bearer $BEARER_ACCESS_TOKEN" \
  "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/defaultLocation:finalize" \
  --header "Content-Type: application/json" \
  --data '{"locationId":"us-central"}'

read -p "Visit \
  https://firebase.corp.google.com/u/0/project/${PROJECT_ID}/database/firestore/indexes \
  to create the database. Choose start in test mode. \
  Then come back here and press [Enter] to continue ..."

BUCKET_NAME=${PROJECT_ID}.appspot.com
git clone $GIT_REPOSITORY
cd ${CURRENT_PATH}/barnard-language-learning-app

firebase login
firebase use ${PROJECT_ID}
sed -i "" -e "s/barnard-project/${PROJECT_ID}/g" .firebaserc
sed -i "" -e "s/barnard-project/${PROJECT_ID}/g" ./src/utils/ApiUtils.js

# Initiate firestore & storage & functions
firebase init firestore
firebase init storage
firebase init functions

cd  ./functions
npm install
firebase deploy --only functions

RESPONSE=$(curl \
  -X POST -H "Authorization: Bearer $BEARER_ACCESS_TOKEN" \
  https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps \
  --header "Content-Type: application/json" \
  --data '{"displayName": "'${PROJECT_ID}'"}')

echo $RESPONSE

# APP_ID="$(echo $RESPONSE | jq '.name' | sed 's/.*\///' | sed 's/\"//')"

sleep 10

read -p "Add Hosting URL to the app visiting \
  https://firebase.corp.google.com/u/0/project/${PROJECT_ID}/settings/general/web .\
  Then come back here and press [Enter] to continue..."

RESPONSE=$(curl \
  -X GET -H "Authorization: Bearer $BEARER_ACCESS_TOKEN" \
  https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps)

APP_ID="$(echo $RESPONSE | jq '.apps[0] .appId' | sed 's/\"//g')"
echo $APP_ID

CONFIG=$(curl \
  -X GET -H "Authorization: Bearer $BEARER_ACCESS_TOKEN" \
  https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps/${APP_ID}/config)

echo $CONFIG

cd ${CURRENT_PATH}/barnard-language-learning-app

sed -i "" -e "s/\"_CONFIG_PLACEHOLDER_\"/$(echo $CONFIG | \
  sed -e 's/\\/\\\\/g; s/\//\\\//g; s/&/\\\&/g')/g" ./src/config.json

npm install
npm run build
firebase deploy

CLIENT_ID="$(cat $CLIENT_ID_FILE | jq '.installed .client_id')"
CLIENT_SECRET="$(cat $CLIENT_ID_FILE | jq '.installed .client_secret')"

CLIENT_ID="$(cat $CLIENT_ID_FILE | jq '.installed .client_id' | sed 's/\"//g')"
CLIENT_SECRET="$(cat $CLIENT_ID_FILE | jq '.installed .client_secret' | sed 's/\"//g')"

RESPONSE=$(curl \
  -X PATCH -H "Authorization: Bearer $BEARER_ACCESS_TOKEN" \
  https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/google.com \
  --header "Content-Type: application/json" \
  --data '{"name": "'projects/${PROJECT_ID}/defaultSupportedIdpConfigs/google.com'" ,
          "enabled": true ,
          "clientId": "'${CLIENT_ID}'" ,
          "clientSecret": "'${CLIENT_SECRET}'"
          }')