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
		audio = new Audio,
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
		const sc_shufl  = /* .......... */ SCPlayer.cNode('sc-shfl-tracks');
		const sc_trmove = /* .......... */ SCPlayer.cNode('sc-move-tracks');

		sc_player.className = `sc-player-${theme} sc-P-${variant} sc-C-${colors}`;
		sc_ui.trkPlace = document.createTextNode('\xA0\xA0🢖 · · · · · · · · · · 🢔');
		sc_dropbx.append(sc_shufl , sc_trmove);
		sc_player.append(sc_tracks, sc_ctrlbx, sc_dropbx);
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
			const sc_tradd = SCPlayer.cNode('sc-add-files', 'label');
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

		if ((this._audio = audio));
			audio.autoplay = true;

		this._dly  = this._num = -1;
		this._its  = this._rid =  0;
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

	get play_mode( ) { return this._cycl | (this._audio.loop << 1); }
	set play_mode(m) {
		this._cycl /*~*/ = (m & 0x3) === 1;
		this._audio.loop = (m & 0x3) === 2;
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
		const yMax = Math.round(artwork.scrollHeight - artwork.clientHeight);
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
		const xMax  = Math.round(artwork.scrollWidth - artwork.clientWidth);
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
			currTrack.classList.remove('S-current');
		navcl.remove('H-prev', 'H-next');

		let key = '';
		if((this._scui.currTrack = track)) {
			key = track.id.substring(4 + (this._guid > 9));
			/***/ track.classList.add('S-current');
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
		const { ctrlBox, trTitle, trArtist, trLirika, artwork } = this._scui;
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

		/*~~~~*/ ctrlBox.classList.remove('S-played', 'S-paused');
		if (url) ctrlBox.classList.add   ('S-played');

		this._audio.src = url;
		this._its = 0;
		this._rid = (url && this._rid) || requestAnimationFrame(t => this._onMediaHandler(t));
	}

/**
 * @param {Event} e
 */
	_onMediaHandler(t = 0, ready = false) {
		const { currTrack, timekind, playBar /****/ } = this._scui;
		const { currentTime: ms, duration: d, ended } = this._audio;
		const loaded = (d > 0);

		if(!ready && loaded) {
			currTrack.dataset.duration = // vv v
			timekind.dataset.duration = SCPlayer.timeCalc(d);
			timekind.dataset.pos = '00:00';
		}
		if (this._its !== -1) {
			let ind = Math.floor(ms/d*10000)/100;
			if ((ms - this._its) >= 1) {
				timekind.dataset.pos = SCPlayer.timeCalc(
					(this._its = ms)
				);
			}
			playBar.style.setProperty('--bar-ind',`${loaded ? ind : 0}%`);
		}
		if (ended) {
			this._rid = 0;
			let nxt = currTrack.nextElementSibling || (
				this._cycl ? currTrack.parentNode.firstElementChild : null
			);
			this.selectTrack(nxt);
		} else
		if (this._rid) {
			this._rid = requestAnimationFrame(t => this._onMediaHandler(t, loaded));
		}
	}
/**
 * @param {DragEvent} e
 */
	_onDragNDropHandler(e) {
		e.preventDefault();
		const { classList:clist, firstElementChild:place } = this._scui.dropBox;
		switch (e.type) {
		case 'drop':
			this.addTracksFromFiles(e.dataTransfer.files);
		case 'dragleave':
			this._dly = setTimeout(() => {
				clist.remove('S-active');
				place.textContent = '';
			}, 150);
			break;
		case 'dragover':
			if(!clist.contains('S-active')) {
				clist.add('S-active');
				place.textContent = `${SCPlayer.SUPPORTED_FORMATS.join(' ')} + jpg png webp`;
			}
			clearTimeout(this._dly);
			break;
		}
	}
/**
 * @param {MouseEvent} e
 */
	_onClickHandler({ target: el }) {

		const { playlist, currTrack } = this._scui;

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
			if (pcl.contains('S-played'))
				if (pcl.toggle('S-paused')) {
					this._audio.pause();
					this._rid = 0;
				} else {
					this._audio.play();
					this._rid = requestAnimationFrame(t => this._onMediaHandler(t, true));
				}
			else if ((el = playlist.children[0]))
				this.selectTrack(el);
			break;
		case 'sc-track':
			if (!pcl.contains('S-trmove') && !ccl.contains('S-current'))
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
				let i = this._cycl - (this._audio.loop - 1);
				let c = this._cycl /*~*/ = (i === 1);
				let l = this._audio.loop = (i === 2);
				el.title        = SCPlayer.PLAY_MODE_SET[i].title;
				el.dataset.mode = SCPlayer.PLAY_MODE_SET[i].name;
			}
			break;
		case 'sc-move-tracks':
			if (!pcl.contains('S-active')) {
				playlist.onpointerdown = (
					playlist.classList.toggle('S-trmove') ? e => {
						if (!e.button && e.target !== playlist)
							this._onTrackMove(e);
					} : null);
			}
			break;
		case 'sc-shfl-tracks':
			if (!pcl.contains('S-active'))
				playlist.append(...SCPlayer.shuffle(playlist.children))
			break;
		default:
			// ...
		}
	}
/**
 * @param {PointerEvent} e
 */
	_onTrackMove({ target:trk, clientY:iy}) {
		const { playlist, trkPlace } = this._scui;
		const { classList: Lcs, style:css } = trk;
		const { height:maxh, top:sy,
			    width:maxw, left:sx } = playlist.getBoundingClientRect();

		css.top   = `${iy + 10}px`;
		css.left  = `${sx - 10}px`;
		css.width = `${maxw - 25}px`;

		Lcs.add('S-freemv');
		trk.before(trkPlace);

		SCPlayer._bindPointer(({ target:itm, clientY:y, layerY }, is_end = false) => {
			if (is_end) {
				css.left = css.top = css.width = null;
				Lcs.remove('S-freemv');
				playlist.replaceChild(trk, trkPlace);
			} else {
				css.top = `${y + 10}px`;
				if (playlist !== itm.parentNode) {
					if ((maxh + sy) < y)
						playlist.scrollTop += 10;
					else if (sy > y)
						playlist.scrollTop -= 10;
				} else if (itm !== trkPlace && itm !== trk)
					playlist.insertBefore(trkPlace, layerY <= 10 ? itm : itm.nextElementSibling);
			}
		});
	}

/**
 * @param {PointerEvent} e
 */
	_onBarChange({clientX, clientY}, is_play_bar = false) {

		const { timekind, volume, playBar, volBar } = this._scui;
		const bar = is_play_bar ? playBar: volBar;

		if (is_play_bar)
			this._its = -1; // stops indicator update

		bar.style.setProperty('--bar-ind','100%'); // reset bar to 100% w:h

		if (!is_play_bar)
			volume.classList.add('S-hold');

		const { left:sx, width:maxw, // get bar coords and sizes 
				top:sy, height:maxh } = bar.getBoundingClientRect();

		const onMove = ({ clientX:x, clientY:y }, is_end = false) => {
			let v = SCPlayer.dPos(x,y,sx,sy,maxw,maxh);
			let p = (v * 100).toFixed(2);
			bar.style.setProperty('--bar-ind',`${p}%`);
			if (is_play_bar) {
				timekind.dataset.pos = SCPlayer.timeCalc((v *= this._audio.duration));
				if (is_end)
					this._audio.currentTime = this._its = v;
			} else {
				volume.dataset.percent = p.substring(0, p.length - 3);
				this._audio.volume = v;
				if (is_end)
					volume.classList.remove('S-hold');
			}
		}
		SCPlayer._bindPointer(onMove); onMove({clientX, clientY});
	}
	static _bindPointer(onMove = () => void 0) {
		const onEnd = e => {
			window.removeEventListener('pointercancel', onEnd);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onEnd);
			if (e.type.endsWith('up'))
				onMove(e, true);
		}
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
	static shuffle(tracks) {
		const list = Array.from(tracks);
		for (let j = 1, i = 0; i < list.length; i++, j++) {
			const n = Math.floor(Math.random() * j); // rand int 0 =< j =< i
			[list[i], list[n]] = [list[n], list[i]];
		}
		return list;
	}
	static dPos(x=0, y=0, sx=0, sy=0, maxw=100, maxh=100) {
		let vmax, v;
		if (maxh > maxw)
			vmax = maxh, v = sy + maxh - y;
		else
			vmax = maxw, v = x - sx;
		return v <= 0 ? 0 : v >= vmax ? 1.0 : Math.floor(v/vmax * 1e4) / 1e4;
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
