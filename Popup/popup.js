console.log("Popup lodaded!");
const toggleSwitch = document.getElementById("toggleSwitch");


chrome.storage.local.get(["isDisabled"], function(result)
{
    const isEnabled = result.isDisabled || false;
    toggleSwitch.checked = isEnabled; 
}
);

toggleSwitch.addEventListener('change', function ()
{
    const isDisabled = !toggleSwitch.checked;

    if (!isDisabled)
    {
        disableExtension(!isDisabled);
    }else
    {
        enableExtension(!isDisabled);
    }

});

function disableExtension(isDisabled)
{
    chrome.storage.local.set({ isDisabled: true }, function () 
    {
        chrome.runtime.sendMessage({ action: "DISABLE_EXTENSION" });
        handleToggleAnimation(isDisabled);
    });
}

function enableExtension(isDisabled)
{
    chrome.storage.local.set({ isDisabled: false }, function () 
    {
        chrome.runtime.sendMessage({ action: "ENABLE_EXTENSION" });
        handleToggleAnimation(isDisabled);
    });
}

function handleToggleAnimation(isEnabled) {
    const slider = toggleSwitch.nextElementSibling;
    slider.style.backgroundColor = isEnabled ? "#4CAF50" : "#ccc";
}