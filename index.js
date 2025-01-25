// server.js
const express = require("express");
const http = require("http");
const admin = require("firebase-admin");
const serviceAccount = process.env.KEY_JSON ? JSON.parse(process.env.KEY_JSON) : require("./key.json");

const app = express();
const server = http.createServer(app);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mrhonbook-default-rtdb.firebaseio.com",
});

const db = admin.database();
const projectName = "ProjectName";

app.get("/", (req, res) => {
  res.send("Server is up and running!");
});

app.use(express.json());

//On recording end, UPDATE data for performing clients
app.post("/api/endrecording", async (req, res) => {
  try {
    console.log(req.body)
    const { clientId, audioData, mocapData, sceneId } = req.body;

    await db
      .ref(`${projectName}/scenes/${sceneId}/samples/${clientId}`)
      .update({
        recordedAudio: audioData,
        recordedMocap: mocapData,
        endedAt: Date.now(),
      });

    return res.status(200).json({
      message: "Recording ended, data updated",
    });
  } catch (error) {
    console.error("error updating recording data:", error);
    return res.status(500).json({ error: "Failed to update recording data" });
  }
});

// On annotation end, CREATE new annotation
app.post("/api/annotation", async (req, res) => {
  try {
    const { annotationData, clientId, sceneId } = req.body;
    const newAnnotationRef = db
      .ref(`${projectName}/scenes/${sceneId}/annotations`)
      .push();
    await newAnnotationRef.set({
      clientId,
      annotationData,
      createdAt: Date.now(),
    });

    return res.status(201).json({
      message: "Annotation created successfully",
      annotationId: newAnnotationRef.key,
    });
  } catch (error) {
    console.error("error creating annotations:", error);
    return res.status(500).json({ error: "Failed to create annotation" });
  }
});

// On annotation delete, DELETE new annotation
app.delete("/api/annotations", async (req, res) => {
  try {
    const { sceneId, annotationId } = req.body;
    await db
      .ref(`${projectName}/scenes/${sceneId}/annotations/${annotationId}`)
      .remove();

    return res.status(200).json({
      message: "Annotation deleted successfully",
    });
  } catch (error) {
    console.error("error deleting annotations:", error);
    return res.status(500).json({ error: "Failed to delete annotation" });
  }
});

// On library change, update current scene
app.post("/api/scenechanged/:sceneId", async (req, res) => {
  try {
    const { sceneId } = req.params;
    await db.ref(`${projectName}/currentScene`).set(`${sceneId}`);

    return res.status(200).json({ message: "successfully changed current scene" });
  } catch (error) {
    console.error("Error updating current scene", error);
    return res.status(500).json({ error: "Error updating current scene" });
  }
});

// Get the current scene configuration
app.get("/api/currentscene", async (req, res) => {
  try {
    const snapshot = await db.ref(`${projectName}/currentScene`).once("value");
    const currentScene = snapshot.val() || null;

    const sceneSnapshot = await db
      .ref(`${projectName}/scenes/${currentScene}`)
      .once("value");
    const sceneConfig = sceneSnapshot.val() || {};

    return res.status(200).json(sceneConfig);
  } catch (error) {
    console.error("Error reading scene config:", error);
    return res.status(500).json({ error: "Failed to read scene config" });
  }
});

// Get the current scene configuration
app.get("/api/currentsceneid", async (req, res) => {
  try {
    const snapshot = await db.ref(`${projectName}/currentScene`).once("value");
    const currentScene = snapshot.val() || null;

    return res.status(200).json({currentScenetId: currentScene});
  } catch (error) {
    console.error("Error reading scene config:", error);
    return res.status(500).json({ error: "Failed to read scene config" });
  }
});

// Get the playback files
app.post("/api/playback", async (req, res) => {
  try {
    const { sceneId, clientId } = req.body;
    const snapshot = await db
      .ref(`${projectName}/scenes/${sceneId}/samples`)
      .once("value");
    const files = snapshot.val() || null;

    //Remove any unnecessary files using client ID
    for (const file in files) {
      if (file === clientId) {
        delete files[file];
      }
    }

    return res.status(200).json(files);
  } catch (error) {
    console.error("Error reading scene config:", error);
    return res.status(500).json({ error: "Failed to read scene config" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});