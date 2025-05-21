import * as tf from "./Model/tf.fesm.js";

async function predict(features)
{
	
	const model = await tf.loadLayersModel(chrome.runtime.getURL('Model/model.json'));

	if(model)
	{
		const inputTensor = tf.tensor2d([features], [1, 33]);
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


//ServiceWorker -- manage all events from all the scripts
console.log("Service worker loaded!");

let isDisabled = false;

chrome.runtime.onInstalled.addListener(() => {
	console.log("Extension Installed!");
});


//Managing all the messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
{
	if(!isDisabled)
	{
		if (!message.action)
		{
			console.log("Recieved message without action! Message ignored!");
			sendResponse({ status: "error"});
			return;
		}

		//Processing messages
		switch(message.action)
		{
			case "PREDICTION_RESULT":
				console.log("Prediction: ", message.prediction)
				return;

			case "FEATURES_EXTRACTED":
				console.log("Features :", message.content);
				console.log(predict(message.content));
				return;

			default:
				console.log("Recieved message with unknown action!");
				sendResponse({ status: "error"});
				return;
	}
	}
}
);