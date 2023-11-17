let DEBUG = false;

let cachedOpacity = 0;

const providers = ["Twitch", "7TV", "BTTV", "FFZ"];
const staticEmoteUrls = ["", "https://7tv.app/emotes/", "https://betterttv.com/emotes/", "https://www.frankerfacez.com/emoticon/"];
const providerIds = {
	"Twitch": 0,
	"_7TV": 1,
	"BTTV": 2,
	"FFZ": 3
};

let Channel = {
	info: {
		name: null,
		id: 0,
		emotes: {},
		duplicateEmotes: {}
	},

	initId: async function() {
		const channelID = await getJson(`https://decapi.me/twitch/id/${Channel.info.name}`);
		if(channelID.includes("User not found")) {
			return;
		}

		Channel.info.id = channelID;
		DEBUG && console.log(Channel.info.name + ": " + channelID);
	},

	loadAllEmotes: async function() {
		DEBUG && console.log("[Adamci API] Loading All Emotes...");

		const twitchEndpoints = ["global/emotes/all", `channel/${encodeURIComponent(Channel.info.name)}/emotes/all`];

		for (const endpoint of twitchEndpoints) {
			const json = await getJson(`https://emotes.adamcy.pl/v1/${endpoint}`);

			const isGlobal = endpoint.includes("global/emotes");
			const globalString = isGlobal ? "/GLOBAL" : "";

			if(json.error !== undefined) {
				console.error(`[Adamci API${globalString}] ${endpoint}: ${json.error}`);
				continue;
			}

			if(json.length === 0) {
				console.error(`[Adamci API${globalString}] ${endpoint}: No Emotes found!`);
				continue;
			}

			json.forEach(emote => {
				const providerName = providers[emote.provider];
				const imageUrl = emote.urls.slice(-1)[0].url.replace("light", "dark");
				const emoteIdSplit = imageUrl.split('/');
				const emoteId = emoteIdSplit[emoteIdSplit.length - 2];

				let url = staticEmoteUrls[emote.provider];
				if (url === "") {
					url = imageUrl;
				}
				else if(emote.provider === 3) { // 7TV
					url = `${url}${emoteId}-${emote.code}`;
				}
				else {
					url = `${url}${emoteId}`;
				}
				
				const newEmote = {
					name: emote.code,
					id: emoteId,
					type: providerName,
					url: url,
					imageUrl: imageUrl,
					isGlobal: isGlobal
				};
	
				if (Channel.info.emotes[emote.code] === undefined) {
					Channel.info.emotes[emote.code] = [newEmote];
				}
				else {
					Channel.info.emotes[emote.code].push(newEmote);
					Channel.info.duplicateEmotes[emote.code] = Channel.info.emotes[emote.code];
				}

				DEBUG && console.log(`[Adamci API/${providerName}${globalString}] ${emote.code}: ${imageUrl}`);
			});

			DEBUG && console.log(`[Adamci API${globalString}] Done!`);
		}
	},

	loadTwitchEmotes: async function() {
		DEBUG && console.log("[Twitch] Loading emotes...");

		const twitchEndpoints = ["global/emotes/twitch", `channel/${encodeURIComponent(Channel.info.name)}/emotes/twitch`];
		for (const endpoint of twitchEndpoints) {
			const json = await getJson(`https://emotes.adamcy.pl/v1/${endpoint}`);

			const isGlobal = endpoint.includes("global/emotes");
			const globalString = isGlobal ? "/GLOBAL" : "";

			if(json.error !== undefined) {
				console.error(`[Adamci API/Twitch${globalString}] ${endpoint}: ${json.error}`);
				continue;
			}

			if(json.length === 0) {
				console.error(`[Adamci API/Twitch${globalString}] ${endpoint}: No Emotes found!`);
				continue;
			}

			json.forEach(emote => {
				const providerName = providers[emote.provider];
				const imageUrl = emote.urls.slice(-1)[0].url.replace("light", "dark");
				const emoteIdSplit = imageUrl.split('/');
				const emoteId = emoteIdSplit[emoteIdSplit.length - 2];

				let url = staticEmoteUrls[emote.provider];
				if (url === "") {
					url = imageUrl;
				}
				else if(emote.provider === 3) { // 7TV
					url = `${url}${emoteId}-${emote.code}`;
				}
				
				const newEmote = {
					name: emote.code,
					id: emoteId,
					type: providerName,
					url: url,
					imageUrl: imageUrl,
					isGlobal: isGlobal
				};
	
				if (Channel.info.emotes[emote.code] === undefined) {
					Channel.info.emotes[emote.code] = [newEmote];
				}
				else {
					Channel.info.emotes[emote.code].push(newEmote);
					Channel.info.duplicateEmotes[emote.code] = Channel.info.emotes[emote.code];
				}

				DEBUG && console.log(`[Adamci API/Twitch${globalString}] ${emote.code}: ${imageUrl}`);
			});

			DEBUG && console.log(`[Adamci API/Twitch${globalString}] Done!`);
		}
	},

	loadFfzEmotes: async function() {
		DEBUG && console.log("[FFZ] Loading Emotes...");

		const ffzEndpoints = ["emotes/global", `users/twitch/${encodeURIComponent(Channel.info.id)}`];
		for (const endpoint of ffzEndpoints) {
			const json = await getJson(`https://api.betterttv.net/3/cached/frankerfacez/${endpoint}`);

			const isGlobal = endpoint === "emotes/global";
			const globalString = isGlobal ? " GLOBAL" : "";

			if(json.length === 0) {
				console.error(`[FFZ${globalString}] No user found!`);
				continue;
			}

			json.forEach(emote => {
				const url = `https://www.frankerfacez.com/emoticon/${emote.id}`;
				let imageUrl = "";
				let upscale = false;

				if (emote.images["4x"]) {
					imageUrl = emote.images["4x"];
					upscale = false;
				} else {
					imageUrl = emote.images["2x"] || emote.images["1x"];
					upscale = true;
				}

				const newEmote = {
					name: emote.code,
					id: emote.id,
					type: "FFZ",
					url: url,
					imageUrl: imageUrl,
					isGlobal: isGlobal,
					upscale: upscale
				};
	
				if (Channel.info.emotes[emote.code] === undefined) {
					Channel.info.emotes[emote.code] = [newEmote];
				}
				else {
					Channel.info.emotes[emote.code].push(newEmote);
					Channel.info.duplicateEmotes[emote.code] = Channel.info.emotes[emote.code];
				}

				DEBUG && console.log(`[FFZ${globalString}] ${emote.code}: ${url}`);
			});

			DEBUG && console.log(`[FFZ${globalString}] Loading Emotes from ${endpoint}: Done!`);
		}
	},

	loadBttvEmotes: async function() {
		DEBUG && console.log("Loading BTTV Emotes...");

		const bttvEndpoints = ["emotes/global", `users/twitch/${encodeURIComponent(Channel.info.id)}`];
		for (const endpoint of bttvEndpoints) {
			let json = await getJson(`https://api.betterttv.net/3/cached/${endpoint}`);

			const isGlobal = endpoint === "emotes/global";
			const globalString = isGlobal ? " GLOBAL" : "";

			if(json.message !== undefined) {
				console.error(`[BTTV${globalString}] Error: ${json.message}`);
				continue;
			}

			if (!Array.isArray(json)) {
				json = json.channelEmotes.concat(json.sharedEmotes);
			}

			json.forEach(emote => {
				const url = `https://betterttv.com/emotes/${emote.id}`;
				const imageUrl = `https://cdn.betterttv.net/emote/${emote.id}/3x`

				const newEmote = {
					name: emote.code,
					id: emote.id,
					type: "BTTV",
					url: url,
					imageUrl: imageUrl,
					isGlobal: isGlobal,
					zeroWidth: ["5e76d338d6581c3724c0f0b2", "5e76d399d6581c3724c0f0b8", "567b5b520e984428652809b6", "5849c9a4f52be01a7ee5f79d", "567b5c080e984428652809ba", "567b5dc00e984428652809bd", "58487cc6f52be01a7ee5f205", "5849c9c8f52be01a7ee5f79e"].includes(emote.id) // "5e76d338d6581c3724c0f0b2" => cvHazmat, "5e76d399d6581c3724c0f0b8" => cvMask, "567b5b520e984428652809b6" => SoSnowy, "5849c9a4f52be01a7ee5f79d" => IceCold, "567b5c080e984428652809ba" => CandyCane, "567b5dc00e984428652809bd" => ReinDeer, "58487cc6f52be01a7ee5f205" => SantaHat, "5849c9c8f52be01a7ee5f79e" => TopHat
				};

				if (Channel.info.emotes[emote.code] === undefined) {
					Channel.info.emotes[emote.code] = [newEmote];
				}
				else {
					Channel.info.emotes[emote.code].push(newEmote);
					Channel.info.duplicateEmotes[emote.code] = Channel.info.emotes[emote.code];
				}

				DEBUG && console.log(`[BTTV${globalString}] ${emote.code}: ${url}`);
			});

			DEBUG && console.log(`[BTTV${globalString}] Loading Emotes from ${endpoint}: Done!`);
		}
	},

	load7tvEmotes: async function() {
		DEBUG && console.log("[7TV] Loading emotes...");

		const _7tvEndpoints = ["emote-sets/global", `users/twitch/${encodeURIComponent(Channel.info.id)}`];
		for (const endpoint of _7tvEndpoints) {
			const json = await getJson(`https://7tv.io/v3/${endpoint}`);
			
			const isGlobal = endpoint === "emote-sets/global";
			const globalString = isGlobal ? "/GLOBAL" : "";

			if(json.error !== undefined) {
				console.error(`[7TV${globalString}] ${json.error}`);
				continue;
			}

			let emotes = isGlobal ? json.emotes : json.emote_set.emotes;

			if(emotes === undefined) {
				DEBUG && console.log(`[7TV${globalString}] Done!`);
				continue;
			}

			emotes.forEach(emote => {
				const host = emote.data.host;

				const newEmote = {
					name: emote.name,
					id: emote.id,
					type: "7TV",
					url: `https://7tv.app/emotes/${emote.id}`,
					imageUrl: `https:${host.url}/${host.files.slice(-1)[0].name}`,
					isGlobal: isGlobal
				};

				if (Channel.info.emotes[emote.name] === undefined) {
					Channel.info.emotes[emote.name] = [newEmote];
				}
				else {
					let misduplicate = Channel.info.emotes[emote.name].some(oldEmote => 
						oldEmote.name === newEmote.name &&
						oldEmote.id === newEmote.id &&
						oldEmote.type === newEmote.type
					);

					if(misduplicate) {
						return;
					}

					Channel.info.emotes[emote.name].push(newEmote);
					Channel.info.duplicateEmotes[emote.name] = Channel.info.emotes[emote.name];
				}

				DEBUG && console.log(`[7TV${globalString}] ${emote.name}: ${newEmote.url}`);
			});

			DEBUG && console.log(`[7TV${globalString}] Done!`);
		}
	},

	loadEmotes: async function() {
		await Channel.loadAllEmotes();

		await Channel.initId();

		if(Channel.info.emotes.length === 0) {
			// await Channel.initId();

			if(Channel.info.id !== 0) {
				await Channel.loadTwitchEmotes();
				await Channel.loadFfzEmotes();
				await Channel.loadBttvEmotes();
				// await Channel.load7tvEmotes();
			}
		}

		if(Channel.info.id !== 0) {
			await Channel.load7tvEmotes();
		}

		DEBUG && console.log("Loading emotes: done!");
		DEBUG && console.log(Channel.info.emotes);
	},

	load: async function() {
		await Channel.initId();
		await Channel.loadEmotes();

		generateHtml();
	},

	init: function(channelName) {
		Channel.info.name = channelName;
		Channel.info.id = 0;
		Channel.info.emotes = {};
		Channel.info.duplicateEmotes = {};
		document.title = channelName + " • Dup Emote Check Tool";
		Channel.load();
	}
};

// https://stackoverflow.com/questions/111529/how-to-create-query-parameters-in-javascript
function encodeQueryData(urlParameters) { 
    const encodedUrlParameters = [];
    for (let urlParameter in urlParameters) {
        if (urlParameters[urlParameter]) {
            encodedUrlParameters.push(encodeURIComponent(urlParameter) + '=' + encodeURIComponent(urlParameters[urlParameter]));
		}
    }
    return encodedUrlParameters.join('&');
}

const onReady = (callback) => {
	if (document.readyState !== "loading") {
		callback();
	}
	else if (document.addEventListener) {
		document.addEventListener("DOMContentLoaded", callback);
	}
	else {
		document.attachEvent("onreadystatechange", function() {
			if (document.readyState === "complete") {
				callback();
			}
		});
	}
};

const getHtml = (url) => fetch(proxy + url, { method: "GET" }).then(async (response) => {
	const text = await response.text();
	return text;
}).catch((error) => {
	console.error(error);
	return {};
});

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
	if (event !== null) {
		event.preventDefault();
	}

	submitContainer.classList.add("disabled");
	userNotFound.classList.add("hidden");
	noEmoteDuplicates.classList.add("hidden");
	result.classList.add("hidden");
	loading.classList.remove("hidden");
	result.textContent = "";

	const channelName = channel.value;

	let urlParameters = {};
	urlParameters.channel = channelName;

	if (DEBUG) {
		urlParameters.debug = true;
	}

	encodedUrlParameters = encodeQueryData(urlParameters);
	let urlParameterString = `${window.location.pathname}${encodedUrlParameters === "" ? "" : "?"}${encodedUrlParameters}`;

	window.history.pushState(null, "", urlParameterString);

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
			
			const emoteImageContainer = document.createElement("div");
			emoteImageContainer.id = "emote-image-container";

			const emoteLink = document.createElement("a");
			emoteLink.href = `${emoteDuplicate.url}`;

			const emoteImage = new Image();
			emoteImage.src = emoteDuplicate.imageUrl;
			emoteImage.id = "emote-image";

			const sizeTagLabel = document.createElement("div");
			sizeTagLabel.id = "tag-label";
			
			emoteImage.onload = function() {
				const sizeTag = document.createTextNode(`${emoteImage.naturalWidth}x${emoteImage.naturalHeight}`);
				sizeTagLabel.appendChild(sizeTag);
				//sizeTag.value = `${image.naturalWidth}x${image.naturalHeight}`;
			};

			emoteLink.appendChild(emoteImage);
			emoteImageContainer.appendChild(emoteLink);

			const submitTagLabel = document.createElement("div");
			submitTagLabel.id = "submit-tag-label";

			const submitButton = document.createElement("input");
			submitButton.type = "button";
			submitButton.onclick = `location.href="${emoteDuplicate.url}"`;
			submitButton.value = `${emoteDuplicate.type}`;

			submitTagLabel.appendChild(submitButton);

			emoteDuplicateEntity.appendChild(emoteImageContainer);
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

	submitContainer.classList.remove("disabled");

	DEBUG && console.log("All emotes: ");
	DEBUG && console.log(Channel.info.emotes);
	DEBUG && console.log("Duplicate emotes: ");
	DEBUG && console.log(Channel.info.duplicateEmotes);
}

const generator = document.getElementById("generator");
const channel = document.getElementById("channel");
const submitContainer = document.getElementById("submit-container");
const loading = document.getElementById("loading");
const userNotFound = document.getElementById("user-not-found");
const noEmoteDuplicates = document.getElementById("no-emote-duplicates");
const result = document.getElementById("result");

generator.addEventListener("submit", (event) => calculateDuplicateEmotes(event));

onReady(() => { 
	const searchParameters = new URLSearchParams(window.location.search);
	if(searchParameters.has("debug")) {
		DEBUG = searchParameters.get("debug").toLocaleLowerCase() === "true";
	}

	if(searchParameters.has("channel")) {
		channel.value = searchParameters.get("channel");
		calculateDuplicateEmotes(null);
	}
});