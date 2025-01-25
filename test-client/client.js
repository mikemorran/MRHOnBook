//EXAMPLES



async function test() {
  try {
    const response = await fetch("http://localhost:3000/api/playback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: "testClient123",
        sceneId: "scene001"
      })
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error during testRecordingEnd:", error);
  }
}

test();

