# Face API / Face Matching with ChromaDB

This module provides the basics for identifying and recognizing faces using the [Face API](https://github.com/vladmandic/face-api/tree/master).
We will leverage ChromaDB as well.

## Docker Container Setup

You will need to install some more packages to use TensorFlow for face detection.

* `apt install -y libhdf5-serial-dev`
* `pip install h5py`
* `pip install tensorflow`

Then run `npm install` from this directory.

Then:
* `npm rebuild @tensorflow/tfjs-node --build-from-source`
* `bash ./download-models.sh`

## Images Download

The `download-models.sh` script should download a .zip file with IMDB images. This was assembled
from two sources:

* [names.csv](https://penn-cis545-files.s3.amazonaws.com/names.csv), which is the original list of actor names from the homeworks. You can update this with whatever IMDB actors you have.
* [IMDB-Face.csv](https://penn-cis545-files.s3.amazonaws.com/IMDb-Face.csv), from https://github.com/fwang91/IMDb-Face.

Where we ran `python get-images.py` to join the overlapping `nconst`s and downloaded associated images. If you have a larger subset of names from IMDB, you can re-run this step yourself and get a lot more images!

## Creating Your ChromaDB Instance

Launch ChromaDB in Docker, via `chroma run --host 0.0.0.0`.

In a separate Docker Terminal, from the same directory, run `node app.js` and let it index everything!

Take a look at the functions in [app.js](app.js), to see examples of computing an embedding from an image, opening a connection to Chroma, indexing in Chroma, and looking up an entry in Chroma.

* `initializeFaceModels` sets up the Face-API (and TensorFlow-JS) to compute embeddings
* `getEmbeddings` uses the Node Face-API to find faces within an image file and return a list of embeddings
* `compareImages` uses the Node Face-API to compare the faces within two image files
* `indexAllFaces` takes an image, finds all faces and computes their embeddings, and puts these into ChromaDB
* `findTopKMatches` uses ChromaDB to find the most similar embedding to that of a supplied image