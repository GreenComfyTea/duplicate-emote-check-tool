let DEBUG = false;

let Channel = {
	info: {
		channel: null,
		emotes: {},
		duplicateEmotes: {}
	},

	loadEmotes: async function(channelID) {
		Channel.info.emotes = {};
		Channel.info.duplicateEmotes = {};

		DEBUG && console.log("Loading FFZ emotes...");
		// Load FFZ emotes
		const ffzEndpoints = ["emotes/global", `users/twitch/${encodeURIComponent(channelID)}`];
		for (const endpoint of ffzEndpoints) {
			const json = await getJson(`https://api.betterttv.net/3/cached/frankerfacez/${endpoint}`);

			const isGlobal = endpoint == "emotes/global";

			json.forEach(emote => {
				let imageUrl = "";
				let upscale = false;

				if (emote.images["4x"]) {
					imageUrl = emote.images["4x"];
					upscale = false;
				} else {
					imageUrl = emote.images["2x"] || emote.images["1x"];
					upscale = true;
				}

				const new_emote = {
					id: emote.id,
					type: "FFZ",
					url: `https://www.frankerfacez.com/emoticon/${emote.id}`,
					imageUrl: imageUrl,
					isGlobal: isGlobal,
					upscale: upscale
				};
	
				if (Channel.info.emotes[emote.code] == undefined) {
					Channel.info.emotes[emote.code] = [new_emote];
				}
				else {
					Channel.info.emotes[emote.code].push(new_emote);
					Channel.info.duplicateEmotes[emote.code] = Channel.info.emotes[emote.code];
				}
			});

			DEBUG && console.log(`Loading FFZ ${endpoint}: done!`);
		}

		DEBUG && console.log("Loading BTTV emotes...");
		// Load BTTV emotes
		const bttvEndpoints = ["emotes/global", `users/twitch/${encodeURIComponent(channelID)}`];
		for (const endpoint of bttvEndpoints) {
			let json = await getJson(`https://api.betterttv.net/3/cached/${endpoint}`);

			const isGlobal = endpoint == "emotes/global";
				
			if (!Array.isArray(json)) {
				json = json.channelEmotes.concat(json.sharedEmotes);
			}

			json.forEach(emote => {
				const new_emote = {
					id: emote.id,
					type: "BTTV",
					url: `https://betterttv.com/emotes/${emote.id}`,
					imageUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
					isGlobal: isGlobal,
					zeroWidth: ["5e76d338d6581c3724c0f0b2", "5e76d399d6581c3724c0f0b8", "567b5b520e984428652809b6", "5849c9a4f52be01a7ee5f79d", "567b5c080e984428652809ba", "567b5dc00e984428652809bd", "58487cc6f52be01a7ee5f205", "5849c9c8f52be01a7ee5f79e"].includes(emote.id) // "5e76d338d6581c3724c0f0b2" => cvHazmat, "5e76d399d6581c3724c0f0b8" => cvMask, "567b5b520e984428652809b6" => SoSnowy, "5849c9a4f52be01a7ee5f79d" => IceCold, "567b5c080e984428652809ba" => CandyCane, "567b5dc00e984428652809bd" => ReinDeer, "58487cc6f52be01a7ee5f205" => SantaHat, "5849c9c8f52be01a7ee5f79e" => TopHat
				};

				if (Channel.info.emotes[emote.code] == undefined) {
					Channel.info.emotes[emote.code] = [new_emote];
				}
				else {
					Channel.info.emotes[emote.code].push(new_emote);
					Channel.info.duplicateEmotes[emote.code] = Channel.info.emotes[emote.code];
				}
			});

			DEBUG && console.log(`Loading BTTV ${endpoint}: done!`);
		}

		DEBUG && console.log("Loading 7TV emotes...");
		// Load 7TV emotes
		const _7tvEndpoints = ["emotes/global", `users/${encodeURIComponent(channelID)}/emotes`];
		for (const endpoint of _7tvEndpoints) {
			const json = await getJson(`https://api.7tv.app/v2/${endpoint}`);

			const isGlobal = endpoint == "emotes/global";

			json.forEach(emote => {
				const new_emote = {
					id: emote.id,
					type: "7TV",
					url: `https://7tv.app/emotes/${emote.id}`,
					imageUrl: emote.urls[emote.urls.length - 1][1],
					isGlobal: isGlobal,
					zeroWidth: emote.visibility_simple.includes("ZERO_WIDTH")
				};

				if (Channel.info.emotes[emote.name] == undefined) {
					Channel.info.emotes[emote.name] = [new_emote];
				}
				else {
					Channel.info.emotes[emote.name].push(new_emote);
					Channel.info.duplicateEmotes[emote.name] = Channel.info.emotes[emote.name];
				}
			});

			DEBUG && console.log(`Loading 7TV ${endpoint}: done!`);
		}

		DEBUG && console.log("Loading emotes: done!");
	},

	load: async function() {
		const channelID = await getJson(`https://decapi.me/twitch/id/${Channel.info.channel}`);
		if(channelID.includes("User not found")) {
			loading.classList.add("hidden");
			userNotFound.classList.remove("hidden");
			return;
		}

		Channel.info.id = channelID;
		DEBUG && console.log(Channel.info.channel + ": " + channelID);
		await Channel.loadEmotes(Channel.info.id);

		generateHtml();
	},

	init: function(channel) {
		Channel.info.channel = channel;
		document.title = "Emote Dup Check Tool • " + channel;
		Channel.load();
	}
};



// https://stackoverflow.com/questions/111529/how-to-create-query-parameters-in-javascript
function encodeQueryData(data) { 
    const ret = [];
    for (let d in data) {
        if (data[d]) {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
		}
    }
    return ret.join('&');
}

const onReady = (callback) => {
	if (document.readyState != "loading") {
		callback();
	}
	else if (document.addEventListener) {
		document.addEventListener("DOMContentLoaded", callback);
	}
	else {
		document.attachEvent("onreadystatechange", function() {
			if (document.readyState == "complete") {
				callback();
			}
		});
	}
};

const getJson = (url) => fetch(url, { method: "GET" }).then(async (response) => {
	const contentType = response.headers.get("Content-Type");
	if (contentType.includes("text/plain")) {
		const text = await response.text();
		return text;
	} else if (contentType.includes("application/json")) {
		return await response.json();
	}
}).catch((error) => console.error(error));

function calculateDuplicateEmotes(event) {
	if (event != null) {
		event.preventDefault();
	}

	userNotFound.classList.add("hidden");
	noEmoteDuplicates.classList.add("hidden");
	result.classList.add("hidden");
	loading.classList.remove("hidden");
	result.textContent = "";

	const channelName = channel.value;

	let urlParameters = `/emote-duplicate-check-tool/?channel=${channelName}`;
	if (DEBUG) {
		urlParameters += `&debug=true`;
	}
	
	window.history.pushState(null, "", urlParameters);

    Channel.init(channelName ? channelName.toLowerCase() : "greencomfytea");
}

function syncGifs() {
	const images = result.getElementsByTagName("img");
	for (const image of images) {
		image.src = image.src;
	}
}

function generateHtml() {
	var noDuplicates = true;

	for(const emote of Object.entries(Channel.info.duplicateEmotes)) {
		noDuplicates = false;

		const emoteDuplicateCard = document.createElement("div");
		emoteDuplicateCard.id = "emote-duplicate-card";
		
		const emoteNameLabel = document.createElement("div");
		emoteNameLabel.id = "emote-name-label";

		const emoteNameText = document.createTextNode(`${emote[0]}`);
	
		emoteNameLabel.appendChild(emoteNameText);
		emoteDuplicateCard.appendChild(emoteNameLabel);
		
		const emoteDuplicateEntities = document.createElement("div");
		emoteDuplicateEntities.id = "emote-duplicate-entities";

		for(const emoteDuplicate of emote[1]) {
			const emoteDuplicateEntity = document.createElement("div");
			emoteDuplicateEntity.id = "emote-duplicate-entity";
			
			const emoteImage = document.createElement("div");
			emoteImage.id = "emote-image-container";

			const emoteLink = document.createElement("a");
			emoteLink.href = `${emoteDuplicate.url}`;

			const image = new Image();
			image.src = emoteDuplicate.imageUrl;
			image.id = "emote-image";

			const sizeTagLabel = document.createElement("div");
			sizeTagLabel.id = "tag-label";
			
			image.onload = function() {
				const sizeTag = document.createTextNode(`${image.naturalWidth}x${image.naturalHeight}`);
				sizeTagLabel.appendChild(sizeTag);
				//sizeTag.value = `${image.naturalWidth}x${image.naturalHeight}`;
			};

			emoteLink.appendChild(image);
			emoteImage.appendChild(emoteLink);

			const submitTagLabel = document.createElement("div");
			submitTagLabel.id = "submit-tag-label";

			const submitButton = document.createElement("input");
			submitButton.type = "button";
			submitButton.onclick = `location.href="${emoteDuplicate.url}"`;
			submitButton.value = `${emoteDuplicate.type}`;

			submitTagLabel.appendChild(submitButton);

			emoteDuplicateEntity.appendChild(emoteImage);
			emoteDuplicateEntity.appendChild(submitTagLabel);
			emoteDuplicateEntity.appendChild(sizeTagLabel);

			if (emoteDuplicate.isGlobal) {
				const globalTagLabel = document.createElement("div");
				globalTagLabel.id = "tag-label";

				const globalTag = document.createTextNode("Global");
				globalTagLabel.appendChild(globalTag);

				emoteDuplicateEntity.appendChild(globalTagLabel);
			}

			emoteDuplicateEntities.appendChild(emoteDuplicateEntity);
		}

		emoteDuplicateCard.appendChild(emoteDuplicateEntities);
		result.appendChild(emoteDuplicateCard);
	}

	if(noDuplicates) {
		loading.classList.add("hidden");
		noEmoteDuplicates.classList.remove("hidden");
	}
	else {
		loading.classList.add("hidden");
		syncGifs();
		result.classList.remove("hidden");
	}

	DEBUG && console.log("All emotes: ");
	DEBUG && console.log(Channel.info.emotes);
	DEBUG && console.log("Duplicate emotes: ");
	DEBUG && console.log(Channel.info.duplicateEmotes);
}

const generator = document.getElementById("generator");
const channel = document.getElementById("channel");
const loading = document.getElementById("loading");
const userNotFound = document.getElementById("user-not-found");
const noEmoteDuplicates = document.getElementById("no-emote-duplicates");
const result = document.getElementById("result");

generator.addEventListener("submit", (event) => calculateDuplicateEmotes(event));

onReady(() => { 
	const searchParameters = new URLSearchParams(window.location.search);
	if(searchParameters.get("debug")) {
		DEBUG = true;
	}

	if(searchParameters.has("channel")) {
		channel.value = searchParameters.get("user");
		calculateDuplicateEmotes(null);
	}
});