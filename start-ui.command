#!/bin/bash
export PATH=~/.nvm/versions/node/v20.12.0/bin:$PATH
cd "$(dirname "$0")/frontend"
npm run dev
