/**
* ***Stylized Common Player***
*
* Customizable HTML Audio Player with various forms and styles.
*
* - **Original source code** — https://github.com/OpenA/stylized-common-player
* - **License** — GNU GPLv3
* - **Author** — OpenA @ (2025)
*
*/

class SCPlayer extends HTMLElement {

	constructor({
		single_audio_instance = false,
		has_touch = ('ontouchstart' in window),
		theme = 'standart',
		variant = 'horizontal',
		colors = 'orange'
	}) {
		const sc_player = super();
		const sc_ui     = {};
		const sc_tracks = sc_ui.playlist = SCPlayer.cNode('sc-tracklist', 'sc-list');
		const sc_addinp = /* .......... */ SCPlayer.cNode('S-hidden', 'input');
		const sc_addbtn = /* .......... */ SCPlayer.cNode('sc-add-track', 'label');
		const sc_dropbx = sc_ui.dropBox  = SCPlayer.cNode('sc-box-drop');
		const sc_ctrlbx = sc_ui.ctrlBox  = SCPlayer.cNode('sc-box-controls');
		const sc_wavefm = sc_ui.waveform = SCPlayer.cNode('sc-waveform');
		const sc_artwrk = sc_ui.artwork  = SCPlayer.cNode('sc-artwork');
		const sc_volume = sc_ui.volume   = SCPlayer.cNode('sc-volume');
		const sc_tscale = sc_ui.timescal = SCPlayer.cNode('sc-time-scale');
		const sc_timein = sc_ui.timekind = SCPlayer.cNode('sc-time-indicators');
		const sc_inflay = sc_ui.infoLyer = SCPlayer.cNode('sc-info-overlay');
		const sc_info   = /* .......... */ SCPlayer.cNode('sc-info-toggle');
		const sc_play   = /* .......... */ SCPlayer.cNode('sc-play-toggle');
		const sc_volbar = sc_ui.volmBar  = SCPlayer.cNode('sc-bar-volume');
		const sc_bufbar = sc_ui.buffBar  = SCPlayer.cNode('sc-bar-buffer');
		const sc_plybar = sc_ui.playBar  = SCPlayer.cNode('sc-bar-plying');
		const sc_scover = /* .......... */ SCPlayer.cNode('sc-cover-slide');

		sc_addinp.type = 'file';
		sc_addinp.multiple = true;
		sc_volbar.style.width = '100%';
		sc_player.className = `sc-player-${theme} sc-P-${variant} sc-C-${colors}`;
		sc_player.append(sc_tracks, sc_dropbx, sc_ctrlbx);
		sc_ctrlbx.append(sc_artwrk, sc_scover, sc_volume, sc_tscale, sc_timein, sc_play, sc_inflay, sc_info);
		sc_dropbx.append(sc_addbtn);
		sc_volume.append(sc_volbar);
		sc_addbtn.append(sc_addinp);
		sc_tscale.appendChild(sc_wavefm).append(sc_bufbar, sc_plybar);

		sc_player.addEventListener('dragover' , e => this._onDragNDropHandler(e));
		sc_player.addEventListener('dragleave', e => this._onDragNDropHandler(e));
		sc_player.addEventListener('drop'     , e => this._onDragNDropHandler(e));
		sc_addinp.addEventListener('change'   , e => this.addTracksFromFiles(e.target.files));
		sc_player.addEventListener('click'    , e => this._onClickHandler(e));
		sc_volume.addEventListener('pointerdown', e => { if (!e.button) this._onBarChange(e, false) });
		sc_tscale.addEventListener('pointerdown', e => { if (!e.button) this._onBarChange(e, true) });
		sc_volume.addEventListener(has_touch ? 'touchstart' : 'mousedown', e => e.preventDefault());
		sc_tscale.addEventListener(has_touch ? 'touchstart' : 'mousedown', e => e.preventDefault());

		sc_ui.currTrack = null;
		sc_ui.audio = single_audio_instance ? SCPlayer.audio : new Audio;
		sc_ui.audio.autoplay = true;

		this._scui = sc_ui;
		this._snid = ++SCPlayer._instances_count;

		Object.defineProperty(this, '_scui', {
			enumerable: false, writable: false
		});
	}

	static get audio() {
		const au = new Audio;
		Object.defineProperty(this, 'audio', { enumerable: true, value: au });
		return au;
	}

	static get metadata_db() {
		const db = new Map;
		Object.defineProperty(this, 'metadata_db', { enumerable: true, value: db });
		return db;
	}

/**
 * @param {[File]} files - if you use blob
 */
	addTracksFromFiles(files) {

		const { playlist, artwork } = this._scui;

		for(const f of files) {
			const mime = f.type.substring(f.type.indexOf('/') + 1);
			const sid = `sc${this._snid}_${f.type}_${f.size}`;

			if (f.type.startsWith('image')) {
				if (!(sid in artwork.children) && !mime.startsWith('x-')) {
					artwork.append( SCPlayer.cItemCover(sid, f) )
				}
			} else if (
				f.type.startsWith('audio') || f.type.startsWith('application') ||
				f.type.startsWith('video') || f.type.startsWith('binary')
			) {
				const info = SCPlayer.parseTrackName(f.name, mime);
				if (!(sid in playlist.children) && info.is_valid) {
					playlist.append( SCPlayer.cItemTrack(sid, f, info) );
				}
			}
		}
	}

	slideToNextCoverY(re_y = false) {
		const { artwork } = this._scui;
		const yMax = Math.round(artwork.scrollTopMax);
		const sTop = Math.round(artwork.scrollTop);
		let y, ry = -1, ny = yMax;
		for (const img of artwork.children) {
			y = img.offsetTop;
			if (y > sTop && y < ny) ny = y; else
			if (y < sTop && y > ry) ry = y;
		}
		artwork.scroll({ behavior: 'smooth',
			top : re_y ? (ry === -1 ? y : ry) : (ny === yMax ? 0 : ny)
		});
	}
	slideToNextCoverX(re_x = false) {
		const { artwork } = this._scui;
		const xMax  = Math.round(artwork.scrollLeftMax);
		const sLeft = Math.round(artwork.scrollLeft);
		let x, rx = -1, nx = xMax;
		for (const img of artwork.children) {
			x = img.offsetLeft;
			if (x > sLeft && x < nx) nx = x; else
			if (x < sLeft && x > rx) rx = x;
		}
		artwork.scroll({ behavior: 'smooth',
			left: re_x ? (rx === -1 ? x : rx) : (nx === xMax ? 0 : nx),
		});
	}

/**
 * @param {HTMLElement} track
 */
	selectTrack(track = this._scui.playlist.children[0]) {
		const au = this._scui.audio;
		const ui = this._scui;
		const {
			url, artist, title, album, cover
		} = SCPlayer.metadata_db.get(track.id.substring(4 + (this._snid > 9)));

		track.classList.add('S-active');

		au.onpause = au.onloadedmetadata =
		au.onended = au.ontimeupdate =
		au.onplay = e => this._onMediaHandler(e);
		ui.currTrack = track;
		au.src = url;
	}

/**
 * @param {Event} e
 */
	_onMediaHandler({ type }) {
		const { currTrack, timekind, ctrlBox, audio, playBar } = this._scui;
		const { currentTime: ms, duration } = audio;

		switch (type) {
		case 'loadedmetadata':
			currTrack.dataset.duration = // vv v
			timekind.dataset.duration = SCPlayer.timeCalc(duration);
			break;
		case 'timeupdate':
			// no effeck
			if(!timekind.classList.contains('S-hook')) {
				timekind.dataset.pos = SCPlayer.timeCalc(ms);
				playBar.style.width = `${ms / duration * 100}%`;
			}
			break;
		case 'play' : ctrlBox.classList.remove('S-paused');
		case 'pause': ctrlBox.classList.add   (`S-${type.substring(0,4)}ed`); break;
		case 'ended': ctrlBox.classList.remove('S-paused', 'S-played');
			//
			/* ~~~ */ currTrack.classList.remove('S-active');
			let nxt = currTrack.nextElementSibling;
			if (nxt)
				this.selectTrack(nxt);
			break;
		}
	}
/**
 * @param {DragEvent} e
 */
	_onDragNDropHandler(e) {
		e.preventDefault();
		switch (e.type) {
		case 'drop':
			this.addTracksFromFiles(e.dataTransfer.files);
		case 'dragleave': this.classList.remove('S-ondrop'); break;
		case 'dragover' : this.classList.add   ('S-ondrop'); break;
		}
	}
/**
 * @param {MouseEvent} e
 */
	_onClickHandler(e) {
		const el = e.target,
			 ccl = el.classList,
			 pcl = el.parentNode.classList;

		switch (ccl[0]) {
		case 'sc-cover-slide':
			this.slideToNextCoverY();
			break;
		case 'sc-info-toggle':
			if (pcl.toggle('S-detail'))
				/**/;
			break;
		case 'sc-play-toggle':
			/**/ if (pcl.contains('S-paused')) this._scui.audio.play();
			else if (pcl.contains('S-played')) this._scui.audio.pause();
			else
				this.selectTrack();
			break;
		case 'sc-track':
			// select track
			if (!ccl.contains('S-active')) {
				if (this._scui.currTrack)
					this._scui.currTrack.classList.remove('S-active');
				this._scui.audio.pause();
				this.selectTrack(el);
			}
			break;
		case 'sc-download':
			SCPlayer.download(el.href);
			break;
		default:
			// ...
		}
	}
/**
 * @param {PointerEvent} e
 */
	_onBarChange(e, is_play_bar = false) {

		const bar    = is_play_bar ? this._scui.playBar  : this._scui.volmBar;
		const audio  = /* ------- */ this._scui.audio;
		const parent = is_play_bar ? this._scui.timekind : this._scui.volume;

		bar.style.width = bar.style.height = null; // reset bar to 100% w:h
		parent.classList.add('S-hook');

		const { left, width:maxw, // get bar coords and sizes 
				top, height:maxh } = bar.getBoundingClientRect();

		const is_vert = maxh > maxw;
		const hPos = x => {
			let v = (x -= left) / maxw;
			if (x < 0)
				x = v = 0;
			else if (x > maxw)
				x = maxw, v = 1.0;
			bar.style.width = `${x.toFixed()}px`;
			return v;
		}
		const vPos = y => {
			let v = (y = top + maxh - y) / maxh;
			if (y < 0)
				y = v = 0;
			else if (y > maxh)
				y = maxh, v = 1.0;
			bar.style.height = `${y.toFixed()}px`;
			return v;
		}
		const onMove = e => {
			const v = is_vert ? vPos(e.clientY) : hPos(e.clientX);
			if (is_play_bar) {
				parent.dataset.pos = SCPlayer.timeCalc(v * 100);
			} else {
				parent.dataset.percent = (v * 100).toFixed();
				audio.volume = v;
			}
		}
		const onEnd = e => {
			window.removeEventListener('pointercancel', onEnd);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onEnd);
			parent.classList.remove('S-hook');

			if (e.type.endsWith('up') && is_play_bar) {
				const v = is_vert ? vPos(e.clientY) : hPos(e.clientX);
				audio.currentTime = audio.duration * v;
			}
		}
		onMove(e);

		window.addEventListener('pointercancel', onEnd);
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onEnd);
	}

	static parseTrackName(name = '', mime = '') {
		let [_, num = '',
			 artist = '',
			  title = (name || `${Date.now()}`),
			    ext = (mime === 'mpeg' ? 'mp3' : mime === 'x-matroska'   ? 'mka' :
				       mime === 'mp4'  ? 'm4a' : mime === 'octet-stream' ? 'bin' : mime)
			] = name.match(
				/^(?:(\d+)[. -]+)?(?:(.+)\s+[—-]+\s+)?(.+)\.([A-z0-9]+)$/
			) || [];
		// ===
		ext = ext.toLowerCase();
		return {
			is_valid: this.SUPPORTED_FORMATS.includes(ext), num, artist, title, ext
		};
	}
/** Create cover item
 * @param {String} sid
 * @param {Blob} file
 */
	static cItemCover(sid, file) {
		const img = new Image;
		const key = sid.substring(sid.indexOf('_') + 1);
		let { url = '' } = this.metadata_db.get(key) || {};

		if(!url) {
			url = URL.createObjectURL(file);
			this.metadata_db.set(key, { url });
		}
		img.id  = sid;
		img.src = url;
		return img;
	}
/** Create track item
 * @param {String} sid
 * @param {File} file
 * @param {Object} info
 */
	static cItemTrack(sid, file, info) {
		const trk = this.cNode('sc-track', 'sc-item');
		const key = sid.substring(sid.indexOf('_') + 1);
		trk.id    = sid;
		trk.title = file.name;
		trk.textContent = info.title;
		trk.dataset.duration = '--:--';
		if(info.artist)
			trk.dataset.artist = info.artist;
		if(!this.metadata_db.has(key)) {
			info.url = URL.createObjectURL(file);
			this.metadata_db.set(key, info);
		}
		return trk;
	}
	static cNode(cName = '', tag = 'div') {
		const el = document.createElement(tag);
		el.className = cName;
		return el;
	}
	static timeCalc(sec = 0) {
		let s = Math.floor(sec +  0) % 60, ds = (s > 9 ? '' : '0') + s;
		let m = Math.floor(sec / 60) % 60, dm = (m > 9 ? '' : '0') + m;
		let h = Math.floor(sec / (60 * 60));

		return `${h ? h +':' : ''}${dm}:${ds}`;
	}

	static _instances_count = 0;
	static SUPPORTED_FORMATS = [
		// AUDIO FORMATS
		'ogg','mka','mp3','m4a','flac','opus','aac',
		// VIDEO FORMATS
		'ogv','mkv','mp4','m4v','webm'
	];
}
customElements.define('sc-player', SCPlayer);
