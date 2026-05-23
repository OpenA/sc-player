
if (typeof MidoraAudio === 'function') {
	Object.defineProperty(SCPlayer.prototype, '_audio', {
		configurable: true,
		get: function() {
			const au = new MidoraAudio; au.autoplay = true;
			Object.defineProperty(this, '_audio', { configurable: true, value: au });
			return au;
		}
	});
	SCPlayer.SUPPORTED_FORMATS.push('wav','aif','aiff');
}

if (typeof MaFFMetadata === 'function') {
	SCPlayer.prototype.getMetadata = function(key) {
		const data = SCPlayer.metadata_db.get(key);
		const url  = (data && data.srcUrl);
		if (  url && !data.has_metadata_read) {
			data.has_metadata_read = true;
			MaFFDataView.fetch(url).then(view => {
				const m = new MaFFMetadata(view);
				if (m.parse()) { //=> success
					const imgs = [];
					const ctrk = this._scui.currTrack;
					for(const tag in m) {
						const val = m[tag];
						if (tag === 'coverArt' && val) {
							imgs.push(val);
							data.coverId = `${val.type}_${val.size}`;
						} else if (val)
							data[tag] = val;
					}
					if (imgs.length)
						this.addTracksFromFiles(imgs);
					if (ctrk && ctrk.id.endsWith(key))
						this.updMediaInfo(data);
				}
			});
		}
		return data;
	};
}
