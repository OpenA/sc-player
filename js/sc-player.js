/**
* ***Stylish Сustom Player***
*
* Customizable HTML Audio Player with various forms and styles.
*
* - **Original source code** — https://github.com/OpenA/sc-player
* - **License** — GNU GPLv3
* - **Author** — OpenA @ (2025)
*
*/

class SCPlayer extends HTMLElement {

	constructor({
		with_local_files = true,
		with_extra_controls = true,
		single_audio_instance = false,
		has_touch = ('ontouchstart' in window),
		theme = 'standart',
		variant = 'horizontal',
		colors = 'orange'
	}) {
		const sc_player = super();
		const sc_ui     = {};
		const sc_tracks = sc_ui.playlist = SCPlayer.cNode('sc-tracklist', 'sc-list');
		const sc_title  = sc_ui.trTitle  = SCPlayer.cNode('sc-info-title');
		const sc_artist = sc_ui.trArtist = SCPlayer.cNode('sc-info-artist');
		const sc_lirika = sc_ui.trLirika = SCPlayer.cNode('sc-info-lirika');
		const sc_dropbx = sc_ui.dropBox  = SCPlayer.cNode('sc-box-drop');
		const sc_ctrlbx = sc_ui.ctrlBox  = SCPlayer.cNode('sc-box-controls');
		const sc_wavefm = sc_ui.waveform = SCPlayer.cNode('sc-waveform');
		const sc_artwrk = sc_ui.artwork  = SCPlayer.cNode('sc-artwork');
		const sc_volume = sc_ui.volume   = SCPlayer.cNode('sc-volume');
		const sc_tscale = sc_ui.timescal = SCPlayer.cNode('sc-time-scale');
		const sc_timein = sc_ui.timekind = SCPlayer.cNode('sc-time-indicators');
		const sc_inflay = /* .......... */ SCPlayer.cNode('sc-info-overlay');
		const sc_info   = /* .......... */ SCPlayer.cNode('sc-info-toggle');
		const sc_play   = /* .......... */ SCPlayer.cNode('sc-play-toggle');
		const sc_volbar = sc_ui.volBar   = SCPlayer.cNode('sc-bar-volume');
		const sc_bufbar = sc_ui.buffBar  = SCPlayer.cNode('sc-bar-buffer');
		const sc_plybar = sc_ui.playBar  = SCPlayer.cNode('sc-bar-plying');
		const sc_scover = /* .......... */ SCPlayer.cNode('sc-cover-slide');

		sc_volbar.style.width = '100%';
		sc_player.className = `sc-player-${theme} sc-P-${variant} sc-C-${colors}`;
		sc_player.append(sc_tracks, sc_dropbx, sc_ctrlbx);
		sc_ctrlbx.append(sc_artwrk, sc_scover, sc_tscale, sc_timein, sc_volume, sc_play, sc_inflay, sc_info);
		sc_inflay.append(sc_title , sc_artist, sc_lirika);
		sc_volume.append(sc_volbar);
		sc_tscale.appendChild(sc_wavefm).append(sc_bufbar, sc_plybar);

		if (with_extra_controls) {
			const sc_plynav = SCPlayer.cNode('sc-play-nav');
			const sc_next   = SCPlayer.cNode('sc-play-next');
			const sc_plmode = SCPlayer.cNode('sc-play-mode');
			const sc_prev   = SCPlayer.cNode('sc-play-prev');
			const mode      = SCPlayer.PLAY_MODE_SET[0];
			sc_plmode.dataset.mode = mode.name;
			sc_plmode.title = mode.title;
			sc_plynav.append(sc_prev, sc_next);
			sc_volume.before(sc_plmode, sc_plynav);
		}
		if (with_local_files) {
			const sc_tradd = SCPlayer.cNode('sc-add-track', 'label');
			const sc_files = sc_tradd.appendChild(document.createElement('input'));
			sc_files.type = 'file';
			sc_files.multiple = sc_files.hidden = true;
			sc_player.addEventListener('dragover' , e => this._onDragNDropHandler(e));
			sc_player.addEventListener('dragleave', e => this._onDragNDropHandler(e));
			sc_player.addEventListener('drop'     , e => this._onDragNDropHandler(e));
			sc_files .addEventListener('change'   , e => this.addTracksFromFiles(e.target.files));
			sc_dropbx.append(sc_tradd);
		}
		sc_player.addEventListener('click'    , e => this._onClickHandler(e));
		sc_volume.addEventListener('pointerdown', e => { if (!e.button) this._onBarChange(e, false) });
		sc_tscale.addEventListener('pointerdown', e => { if (!e.button) this._onBarChange(e, true) });
		sc_volume.addEventListener(has_touch ? 'touchstart' : 'mousedown', e => e.preventDefault());
		sc_tscale.addEventListener(has_touch ? 'touchstart' : 'mousedown', e => e.preventDefault());

		sc_ui.currTrack = null;
		sc_ui.audio = single_audio_instance ? SCPlayer.audio : new Audio;
		sc_ui.audio.autoplay = true;

		this._scui = sc_ui;
		this._guid = ++SCPlayer._instances_count;
		this._cycl = false;

		Object.defineProperties(this, {
			'_scui': { enumerable: false, writable: false },
			'_guid': { enumerable: false, writable: false }
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

	get play_mode( ) { return this._cycl | (this._scui.audio.loop << 1); }
	set play_mode(m) {
		this._cycl /*~~~~~~*/ = (m & 0x3) === 1;
		this._scui.audio.loop = (m & 0x3) === 2;
	}
/**
 * @param {[File]} files - if you use blob
 */
	addTracksFromFiles(files) {

		const { playlist, artwork } = this._scui;

		for(const f of files) {
			const mime = f.type.substring(f.type.indexOf('/') + 1);
			const sid = `sc${this._guid}_${f.type}_${f.size}`;

			if (f.type.startsWith('image')) {
				if (!(sid in artwork.children) && !mime.startsWith('x-')) {
					artwork.append( SCPlayer.cItemCover(sid, f) );
					if (artwork.children.length > 1)
						artwork.classList.add('H-gall');
				}
			} else if (
				f.type.startsWith('audio') || f.type.startsWith('application') ||
				f.type.startsWith('video') || f.type.startsWith('binary')
			) {
				const info = SCPlayer.parseTrackName(f.name, mime);
				if (!(sid in playlist.children) && info.is_valid) {
					playlist.append( SCPlayer.cItemTrack(sid, f, info) );
					playlist.classList.add('H-next');
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
	selectTrack(track) {
		const { currTrack, playlist: { classList: navcl } } = this._scui;

		if (currTrack)
			currTrack.classList.remove('S-active');
		navcl.remove('H-prev', 'H-next');

		let key = '';
		if((this._scui.currTrack = track)) {
			key = track.id.substring(4 + (this._guid > 9));
			/***/ track.classList.add('S-active');
			//
			if (track.previousElementSibling) navcl.add('H-prev');
			if (track.nextElementSibling    ) navcl.add('H-next');
		}
		this.playMediaSource(key);
	}

/**
 * @param {String} dbKey
 */
	playMediaSource(dbKey) {
		const { audio:au, trTitle, trArtist, trLirika, artwork } = this._scui;
		const {
			url = '', artist = '', title = '', album = '', cover = '', comment = ''
		} = SCPlayer.metadata_db.get(dbKey) || {};

		// upd info
		trArtist.textContent = artist;
		trTitle .textContent = title;
		trLirika.textContent = comment;
		trLirika.dataset.album = album;
		// 
		let cover_art = artwork.children[cover];
		if (cover_art)  artwork.scroll({ smooth: 'behavior', top: cover_art.offsetTop });

		au.onpause = au.onloadedmetadata =
		au.onended = au.ontimeupdate =
		au.onplay = url ? e => this._onMediaHandler(e) : null;
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
			let nxt = currTrack.nextElementSibling || (
				this._cycl ? currTrack.parentNode.firstElementChild : null
			);
			this.selectTrack(nxt);
			break;
		}
	}
/**
 * @param {DragEvent} e
 */
	_onDragNDropHandler(e) {
		e.preventDefault();
		const { dropBox } = this._scui;
		switch (e.type) {
		case 'drop':
			this.addTracksFromFiles(e.dataTransfer.files);
		case 'dragleave': dropBox.classList.remove('S-active'); break;
		case 'dragover' : dropBox.classList.add   ('S-active');
		}
	}
/**
 * @param {MouseEvent} e
 */
	_onClickHandler({ target: el }) {

		const { audio, playlist, currTrack } = this._scui;

		const pp = el.parentNode,
			 ccl = el.classList,
			 pcl = pp.classList;

		switch (ccl[0]) {
		case 'sc-cover-slide':
			this.slideToNextCoverY();
			break;
		case 'sc-info-toggle':
			if (pcl.toggle('S-detail'))
				/**/;
			break;
		case 'sc-play-toggle':
			/**/ if (pcl.contains('S-paused')) audio.play();
			else if (pcl.contains('S-played')) audio.pause();
			else if ((el = playlist.children[0]))
				this.selectTrack(el);
			break;
		case 'sc-track':
			if (!ccl.contains('S-active'))
				this.selectTrack(el);
			break;
		case 'sc-play-next':
			if ((el = currTrack.nextElementSibling))
				this.selectTrack(el);
			break;
		case 'sc-play-prev':
			if ((el = currTrack.previousElementSibling))
				this.selectTrack(el);
			break;
		case 'sc-play-mode':
			{
				let i = this._cycl - (audio.loop - 1);
				let c = this._cycl = (i === 1);
				let l = audio.loop = (i === 2);
				let m = SCPlayer.PLAY_MODE_SET[i];
				el.title        = m.title;
				el.dataset.mode = m.name;
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

		const bar    = is_play_bar ? this._scui.playBar  : this._scui.volBar;
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
		const onMove = ({ clientX:x, clientY:y }) => {
			const v = is_vert ? vPos(y) : hPos(x);
			if (is_play_bar) {
				parent.dataset.pos = SCPlayer.timeCalc(audio.duration * v);
			} else {
				parent.dataset.percent = (v * 100).toFixed();
				audio.volume = v;
			}
		}
		const onEnd = ({ type:t, clientX:x, clientY:y }) => {
			window.removeEventListener('pointercancel', onEnd);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onEnd);
			parent.classList.remove('S-hook');

			if (t.endsWith('up') && is_play_bar) {
				const v = is_vert ? vPos(y) : hPos(x);
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
	static PLAY_MODE_SET = [
		{ name: 'PT', title: 'plays tracklist once'},
		{ name: 'CP', title: 'plays tracklist cycled'},
		{ name: 'LT', title: 'loops the played track'}
	];
}
customElements.define('sc-player', SCPlayer);
