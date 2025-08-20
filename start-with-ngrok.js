const ngrok = require("ngrok");
const { spawn } = require("child_process");

(async function () {
  // const devProcess = spawn("npm", ["run", "dev"], {
  //   stdio: "inherit", 
  //   shell: true
  // });

  // await new Promise((resolve) => setTimeout(resolve, 5000));

  const url = await ngrok.connect({
    addr: 3001,
    authtoken: process.env.NGROK_AUTHTOKEN, 
  });

  console.log(`🚀 Backend público en: ${url}`);

  process.on("SIGINT", async () => {
    console.log("Cerrando ngrok...");
    await ngrok.disconnect();
    await ngrok.kill();
    devProcess.kill("SIGINT");
    process.exit();
  });
})();