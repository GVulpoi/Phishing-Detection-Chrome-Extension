const scriptName = Array.from(document.querySelectorAll('script'));

scriptName.forEach((script, index) => 
{
	if (script.src)
	{
		fetch(script.src)
			.then(Response => Response.text())
			.then(code => 
			{
				console.log('Script', index, ':', code);
			}
				)
			.catch(myErr => console.error('Failed to fetch script ${index}:', myErr));
	}
	else
	{
		console.log('Script', index, ':', script.innerHTML);
	}
}
					)