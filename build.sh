#!/bin/bash
cd ./extension/src/sidepanel/angular
npm run build-prod
cd ../../.. # we are in extension
npm run release