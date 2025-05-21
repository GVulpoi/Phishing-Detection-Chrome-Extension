async function predict(features)
{
	const model = await tf.loadLayersModel(chrome.runtime.getURL('../Model/model.json'));

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
