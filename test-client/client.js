const { storage } = require('./firebase');
const { ref, uploadBytesResumable, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const { AudioContext } = require('web-audio-api');

//EXAMPLES
const webserverURL = "https://mrhonbook-132d3a53c108.herokuapp.com";
//const webserverURL = "http://localhost:3000";

//EXAMPLE: On connection, READ the current scene configuration
async function getSceneConfig() {
  const response = await fetch(webserverURL + "/api/currentscene", {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  console.log(data);

  //Download and Handle Associated Files
  for (const id in data.samples) {
    const mocapBlob = await fetchFileBlob(id + "Mocap")
    const audioBlob = await fetchFileBlob(id + "Audio")

    if (!mocapBlob || !audioBlob) {
      console.error('file download not successful for: ', id);
      return;
    }

    //Example decoding mocap file
    const mocapText = await mocapBlob.text();
    const mocapData = JSON.parse(mocapText);
    console.log('Decoded Mocap JSON:', mocapData);

    //Example decoding audio file
    const audioArrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    audioContext.decodeAudioData(
      audioArrayBuffer,
      (decodedBuffer) => {
        console.log('Decoded Audio File:', decodedBuffer);
      },
      (err) => {
        console.error('Could not decode audio file')
      }
    );
  }
}

//EXAMPLE: On recording end, UPDATE audio and mocap data for this client
async function recordMocapAndAudio() {
  //Handle files
  const mocapFile = fs.readFileSync('./hand_data.json');
  const audioFile = fs.readFileSync('./file_example_MP3_5MG.mp3');

  //Upload files
  const mocapDownloadURL = await uploadFile(mocapFile, "testClient123" + "Mocap")
  const audioDownloadURL = await uploadFile(audioFile, "testClient123" + "Audio")
  console.log(mocapDownloadURL, audioDownloadURL)
  if (!mocapDownloadURL || !audioDownloadURL) {
    console.error('missing urls for uploaded files');
    return;
  }

  //Update RTDB with references to files
  const response = await fetch(webserverURL + "/api/endrecording", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: "testClient123",
      sceneId: "scene001",
      mocapData: mocapDownloadURL,
      audioData: audioDownloadURL
    })
  });
  const data = await response.json();
  console.log(data);
}

function uploadFile(fileBuffer, fileName) {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      reject(new Error('No file buffer provided'));
      return;
    }
    const storageRef = ref(storage, `uploads/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, fileBuffer);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        process.stdout.write(`\r${fileName} is ${progress.toFixed(2)}% done`);
      },
      (error) => {
        console.error('\nUpload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`\nFinished uploading ${fileName}, URL: ${downloadURL}`);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

//EXAMPLE: On annotation end, UPDATE annotation for this client
async function recordAnnotation() {
  const response = await fetch(webserverURL + "/api/annotation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      annotationData: "some new annotation data" + Date.now(),
      sceneId: "scene001",
      clientId: "testClient123"
    })
  });
  const data = await response.json();
  console.log(data);
}

//EXAMPLE: On library change, UPDATE the current scene THEN get the current scene configuration
async function updateCurrentScene() {
  const desiredSceneId = "scene001";
  const response = await fetch(webserverURL + `/api/scenechanged/${desiredSceneId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  console.log(data);

  getSceneConfig();
}

//EXAMPLE: On playback start, READ mocap and audio files for all clients except this one (use the locally stored files for playback on this client)
async function startPlayback() {
  const response = await fetch(webserverURL + "/api/playback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: "testClient456",
      sceneId: "scene001"
    })
  });
  const data = await response.json();
  console.log(data);

  //Download and Handle Associated Files
  for (const id in data) {
    const mocapBlob = await fetchFileBlob(id + "Mocap")
    const audioBlob = await fetchFileBlob(id + "Audio")

    //Example decoding mocap file
    const mocapText = await mocapBlob.text();
    const mocapData = JSON.parse(mocapText);
    console.log('Decoded Mocap JSON:', mocapData);

    //Example decoding audio file
    const audioArrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    audioContext.decodeAudioData(
      audioArrayBuffer,
      (decodedBuffer) => {
        console.log('Decoded Audio File:', decodedBuffer);
      },
      (err) => {
        console.error('Could not decode audio file')
      }
    );
  }
}

async function fetchFileBlob(fileName) {
  return new Promise (async (resolve, reject) => {
    try {
      const fileRef = ref(storage, `uploads/${fileName}`);
      const downloadURL = await getDownloadURL(fileRef);
  
      // Fetch the file data as a Blob
      const response = await fetch(downloadURL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
      const fileBlob = await response.blob();
      resolve(fileBlob);
    } catch (error) {
      //console.error('Error fetching file blob:', error);
      reject(error)
    }
  }) 
}
