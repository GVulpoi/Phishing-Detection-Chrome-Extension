//Logistics for fetching scripts and url's of scripts files
const scriptName = Array.from(document.querySelectorAll('script'));

const inlineScripts = scriptName
								.filter(script => !script.src)
								.map(script => script.textContent);

const externalScripts = scriptName
								.filter(script => script.src)
								.map(script => script.src);

console.log("Inline Scripts : ", inlineScripts);
console.log("External Scripts : ", externalScripts);

async function copyCodeFromFile(url)
{
	fetch(url)
			try
			{
				const response = await fetch(url);

				if (!response.ok)
				{
					throw new Error(`The response from url wasn't recieved ${response.statusText}`);
				}

				const data = await response.text();
				console.log(`Script from url : ${url}`, data);
				return data;

			}
			catch(err)
			{
				console.error(`Fetch operation has failed for url ${url}`, err);
			}
}

externalScripts.forEach(	obj =>
							{
								copyCodeFromFile(obj);
							});