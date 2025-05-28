let isDisabled = false;

document.addEventListener("DOMContentLoaded", function () 
{
	console.log("Popup loaded!");

	const toggleSwitch = document.getElementById("toggleSwitch");

	chrome.runtime.sendMessage({ action: "GET_EXTENSION_STATE" }, function (response) {
		isDisabled = response.isDisabled;
		toggleSwitch.checked = isDisabled;
		handleToggleAnimation();
	});

	toggleSwitch.addEventListener('change', function ()
	{
		if (!isDisabled)
		{
			disableExtension();
		}else
		{
			enableExtension();
		}

	});

	function disableExtension()
	{
		isDisabled = true;
		chrome.runtime.sendMessage({ action: "DISABLE_EXTENSION" });
		handleToggleAnimation(isDisabled);

	}

	function enableExtension()
	{
		isDisabled = false;
		chrome.runtime.sendMessage({ action: "ENABLE_EXTENSION" });
		handleToggleAnimation();

	}

	function handleToggleAnimation() 
	{
		const slider = toggleSwitch.nextElementSibling;
		slider.style.backgroundColor = isDisabled ? "#4CAF50" : "#ccc";
	}
});