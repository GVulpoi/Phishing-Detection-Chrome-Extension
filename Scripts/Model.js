//model loader
let model = null;

async function loadModel()
{
	if(!model)
	{
		model = await tf.loadLayersModel(chrome.runtime.getUrl('Model/model.json'));
		console.log("Model loaded!");
	}
}

async function predict(features)
{
	await loadModel();

	if(model)
	{
		const inputTensor = tf.tensor2d([features]);
		const prediction = model.predict(inputTensor);

		const result = await prediction.data();
		return result;
	}
	else
	{
		console.log("Model isn't loaded but predict was called!");
	}

	return null;
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
	if (msg.action === "RUN_PREDICTION") {
		const result = await predict(msg.features);
		sendResponse({ prediction: result });
		return true;
	}
});