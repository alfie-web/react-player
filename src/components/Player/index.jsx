import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import './Player.sass';

import { PlayerTitle, Playlist, Volume } from '../';


export default function Player({ isAudio, playlist, className }) {
	const [playerState, setPlayerState] = useState({
		currentMedia: playlist[0] || {},	// Возможно придется отделить эту штуку в отдельный useState
		// currentDuration: null,
		currentVolume: 1,

		isLoaded: false,
		isPlaying: false,
		isLooped: false,
		isEnded: false,
		// isMuted: false,
		isFullscreen: false	// Возможно вынесем в отдельный стэйт
	})

	const mediaRef = useRef();
	const timeRef = useRef();
	const progressRef = useRef();
	const loadRef = useRef();
	const barRef = useRef();
	const hintRef = useRef();

	const setState = (newProps) => {
		setPlayerState({
			...playerState,
			...newProps
		}) 
	}

	// console.log('RERENDER')


	const addNull = num => {
		return num >= 0 && num <= 9 ? '0' + num : num;
	}
	const timeToFormat = duration => {
		duration = Math.floor(parseInt(duration));
		var hours = Math.floor(duration / 3600);
		duration %= 3600;
		var minutes = Math.floor(duration / 60);
		var seconds = duration % 60;

		return `${hours !== 0 ? addNull(hours) + ':' : ''}${addNull(minutes)}:${addNull(seconds)}`;
	}


	// Выбираю активный медиафайл
	const setCurrentMedia = media => {
		setState({
			currentMedia: media,
			isPlaying: false
		})
		mediaRef.current.load();	// Если завыпендривается, то вынесем в useEffect
		console.log('LOADED')
	}


	const setWaiting = () => {
		console.log('WAITING')
		setState({
			isLoaded: false
		})
	}

	const setReadyToPlay = () => {
		console.log('READY TO PLAY')
		if (!playerState.isLoaded) {
			setState({
				isLoaded: true
			})
		}
	}

	const play = () => {
		if (!playerState.isPlaying && playerState.isLoaded) {
			console.log('play');
			mediaRef.current.play()
				.then(() => {
					setState({
						isPlaying: true
					})
				})
		}
	}

	const pause = () => {
		if (playerState.isPlaying) {
			console.log('pause');
			mediaRef.current.pause();
			setState({
				isPlaying: false
			})
		}
	}

	const playPause = () => {
		if (playerState.isPlaying) {
			pause();
		} else {
			play();
		}
	}

	const onTimeUpdate = () => {
		let currentTime = mediaRef.current.currentTime;
		const duration = playerState.currentMedia.duration;

		timeRef.current.textContent = timeToFormat(currentTime);

		// let progress = ((duration + currentTime) * 100 / duration) - 100;
		let progress = (currentTime / duration) * 100;
		progressRef.current.style.width = progress + '%';

		// Скорее бедет в отдельном useEffect событие ended
		// if (currentTime >= fakeDuration || audioRef.current.ended) {
		// 	handleEnd();
		// }
	}

	const onProgress = (e) => {
		// if (e.target.buffered.length > 0) {	// Без этого buffered почемуто выдаёт ошибку
		if (e.target.buffered.length) {	// Без этого buffered почемуто выдаёт ошибку
			let loadedTime = e.target.buffered.end(e.target.buffered.length - 1);		// Когда я перематываю на позицию больше текущего буфера, создаётся новый 2 и тд 3,4 ...
			const duration = playerState.currentMedia.duration;
			console.log('progress', loadedTime, e.target.buffered.length);
		
			let progress = (loadedTime / duration) * 100;
			loadRef.current.style.width = progress + '%';
		}
	}


	// TODO: Сделать метод универсальным, 
	// чтобы принимал параметром время на которое перемотать, а если не передали, то значит на range выбрали
	const makeRewindCalculation = (e) => {
		const dur = playerState.currentMedia.duration;
		const w = barRef.current.clientWidth;
		let x = e.offsetX === undefined ? e.layerX : e.offsetX;		// В пикселях
		let xproc = (x * 100) / w;	// В процентах
		let sec = (xproc * dur) / 100;

		return [sec, xproc];
	}

	const onRewind = (e) => {
		if (playerState.isLoaded) {
			console.log('rewind')
			const [sec] = makeRewindCalculation(e);

			mediaRef.current.currentTime = sec;
		}
	}

	const showTimeHint = (e) => {
		const [sec, xproc] = makeRewindCalculation(e);

		hintRef.current.style.left = xproc + '%';
		hintRef.current.textContent = sec ? timeToFormat(sec) : '00:00';
	}



	// TODO: Если вынесу в отдельный компонент, то можно сделать локальный стейт для громкости
	// const setVolume = e => {
	// 	let val = e.target.value;
	// 	console.log(val);
	// }







	useEffect(() => {
		// TODO: Когда происходит это событие, нужно блокировать playlist, так как вылезет ошибка. (По сути формально файл загружается, но мы нарушаем загрузку меняя url файла)
		let ref = mediaRef.current;
		ref.addEventListener('waiting', setWaiting);
		return () => ref.removeEventListener('waiting', setWaiting);
	})

	useEffect(() => {
		let ref = mediaRef.current;
		ref.addEventListener('canplay', setReadyToPlay);	// playing
		return () => ref.removeEventListener('canplay', setReadyToPlay);
	})

	useEffect(() => {
		const ref = mediaRef.current;
		ref.addEventListener('timeupdate', onTimeUpdate);
		return () => ref.removeEventListener('timeupdate', onTimeUpdate);
	})

	useEffect(() => {
		const ref = mediaRef.current;
		ref.addEventListener('progress', onProgress);
		return () => ref.removeEventListener('progress', onProgress);
	})

	// useEffect(() => {
	// 	const ref = mediaRef.current;
	// 	ref.addEventListener('seeked', onMediaSeeked);		// По факту событие запустится, когда мы изменим позици воспроизведения
	// 	return () => ref.removeEventListener('seeked', onMediaSeeked);
	// })

	



	useEffect(() => {
		const ref = barRef.current;
		ref.addEventListener('click', onRewind);
		return () => ref.removeEventListener('click', onRewind);
	})

	useEffect(() => {
		const ref = barRef.current;
		ref.addEventListener('mousemove', showTimeHint);
		return () => ref.removeEventListener('mousemove', showTimeHint);
	})
	


	// TODO: Может всё-таки разделить вёрстку на 2 компонента Audio и Video
	// TODO: Повыносить всё так же как PlayerTitle
	return (
		<div className="Player__container">
			<div className={classNames('Player', className, {'Player--audio': isAudio, 'Player--video': !isAudio})}>

				<PlayerTitle title={playerState.currentMedia.title || 'Название медиа'} />

				{ isAudio 
					? <audio ref={mediaRef} src={playerState.currentMedia.url || ''}></audio>
					: <div className="Player__display">
						<video ref={mediaRef} src={playerState.currentMedia.url || ''}></video>
						<div className="Player__overlay"></div>
					</div>
				}


				{/* Возможно повыносить всё на отдельные компоненты */}
				<div className="Player__options">
					<div className="Player__range">
						<div ref={hintRef} className="time-hint"></div>
						{/* TODO: Может без рефов обойтись, просто на onClick вешать */}
						<div className="range" ref={barRef}>		
							<div className={classNames('bar', { 'bar--waiting': !playerState.isLoaded })}></div>
							<div ref={progressRef} className="progress"></div>
							<div ref={loadRef} className="load"></div>
						</div>
					</div>

					<div className="Player__controls">
						<div className="Player__controls-left">
							<div 
								className="Player__play Player__btn" 
								title={ !playerState.isPlaying ? 'Проигрывать' : 'Остановить' }
								onClick={playPause}
							>
								{ !playerState.isPlaying ? <svg viewBox="0 0 16 18" xmlns="http://www.w3.org/2000/svg">
									<path fillRule="evenodd" clipRule="evenodd" d="M13 8.99994L2.5 2.93777L2.5 15.0621L13 8.99994ZM15.5 9.86597C16.1667 9.48107 16.1667 8.51882 15.5 8.13392L2 0.339689C1.33333 -0.045211 0.500002 0.435916 0.500002 1.20572L0.500001 16.7942C0.500001 17.564 1.33334 18.0451 2 17.6602L15.5 9.86597Z"/>
								</svg>
								: <svg viewBox="0 0 15 18" xmlns="http://www.w3.org/2000/svg">
									<path d="M0 1C0 0.447716 0.447715 0 1 0C1.55228 0 2 0.447715 2 1V17C2 17.5523 1.55228 18 1 18C0.447715 18 0 17.5523 0 17V1Z"/>
									<path d="M13 1C13 0.447716 13.4477 0 14 0C14.5523 0 15 0.447715 15 1V17C15 17.5523 14.5523 18 14 18C13.4477 18 13 17.5523 13 17V1Z"/>
								</svg> }
							</div>

							<div className="Player__prev Player__btn" title="Предыдущий">
								<svg viewBox="0 0 15 16" xmlns="http://www.w3.org/2000/svg">
									<path fillRule="evenodd" clipRule="evenodd" d="M0 1.05555C0 1.05555 0 1.05555 0 1.05555C7.08679e-07 0.595313 0.373096 0.222215 0.833333 0.222215C1.29357 0.222215 1.66667 0.595311 1.66667 1.05555V7.03774L13.5 0.205764C14.1667 -0.179137 15 0.301989 15 1.07179L15 14.9282C15 15.698 14.1667 16.1791 13.5 15.7942L1.66667 8.96224V14.9444C1.66667 15.4047 1.29357 15.7778 0.833333 15.7778C0.373096 15.7778 0 15.4047 0 14.9444V1.05555ZM4 7.99999L13 13.1961L13 2.80384L4 7.99999Z"/>
								</svg>
							</div>
							<div className="Player__next Player__btn" title="Следующий">
								<svg viewBox="0 0 15 16" xmlns="http://www.w3.org/2000/svg">
									<path fillRule="evenodd" clipRule="evenodd" d="M13.3333 7.03774V1.05555C13.3333 0.595311 13.7064 0.222215 14.1667 0.222215C14.6269 0.222215 15 0.595312 15 1.05555V14.9444C15 15.4047 14.6269 15.7778 14.1667 15.7778C13.7064 15.7778 13.3333 15.4047 13.3333 14.9444V8.96224L1.5 15.7942C0.833334 16.1791 0 15.698 0 14.9282V1.07179C0 0.301989 0.833334 -0.179137 1.5 0.205764L13.3333 7.03774ZM11 7.99999L2 2.80384L2 13.1961L11 7.99999Z"/>
								</svg>
							</div>
							<div className="Player__duration"><span ref={timeRef}>00:00</span> / { playerState.currentMedia.duration ? timeToFormat(playerState.currentMedia.duration) : '00:00' }</div>
						</div>

						<div className="Player__controls-right">
							{/* <div className="Player__mute Player__btn" title="Без звука">
								<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
									<path d="M9.82842 17.1859C9.58516 17.3264 9.28543 17.3264 9.04213 17.1859L3.72224 14.1469H0.78629C0.352027 14.1469 0 13.7949 0 13.3607V8.64305C0 8.20878 0.352027 7.85676 0.78629 7.85676H3.72224L9.04531 4.81544C9.4224 4.60006 9.90264 4.73113 10.118 5.10817C10.1858 5.2269 10.2215 5.3612 10.2215 5.49793V16.5058C10.2213 16.7864 10.0714 17.0456 9.82842 17.1859ZM8.64901 6.85347L4.32448 9.32554C4.20479 9.394 4.0692 9.4298 3.93136 9.42934H1.57253V12.5745H3.93136C4.06925 12.574 4.20483 12.6098 4.32448 12.6782L8.64901 15.1503V6.85347Z"/>
									<path d="M13.1929 13.8537C12.9207 14.1914 12.4264 14.2449 12.0882 13.9732C11.7497 13.7012 11.6958 13.2063 11.9678 12.8678C11.9678 12.8678 11.9679 12.8677 11.9679 12.8677C12.781 11.7567 12.781 10.2471 11.9679 9.13606C11.6937 8.79928 11.7446 8.30402 12.0813 8.0299C12.4181 7.75578 12.9134 7.80659 13.1875 8.14337C13.1893 8.14558 13.1911 8.14779 13.1929 8.15005C14.4793 9.83366 14.4793 12.17 13.1929 13.8537Z"/>
									<path d="M16.338 16.2125C16.0658 16.5503 15.5715 16.6037 15.2333 16.332C14.8948 16.06 14.8409 15.5651 15.113 15.2266C15.113 15.2265 15.113 15.2265 15.113 15.2265C16.9859 12.7214 16.9859 9.28226 15.113 6.77721C14.8389 6.44043 14.8897 5.94517 15.2265 5.67105C15.5633 5.39693 16.0585 5.44774 16.3326 5.78452C16.3344 5.78673 16.3362 5.78894 16.338 5.7912C18.6482 8.88094 18.6482 13.1228 16.338 16.2125Z"/>
									<path d="M19.483 18.5713C19.2108 18.9091 18.7165 18.9626 18.3783 18.6908C18.0398 18.4188 17.9859 17.9239 18.258 17.5854C18.258 17.5854 18.258 17.5854 18.258 17.5853C21.1767 13.6815 21.1767 8.32209 18.258 4.41837C17.9839 4.08159 18.0347 3.58633 18.3715 3.31221C18.7083 3.03809 19.2035 3.08891 19.4777 3.42568C19.4795 3.4279 19.4812 3.43011 19.483 3.43237C22.8389 7.92081 22.8389 14.083 19.483 18.5713Z"/>
								</svg>
							</div> */}

							<Volume
								mediaRef={mediaRef}
								startVolume={50}
							/>

							{ !isAudio && <div className="Player__fullscreen Player__btn" title={ !playerState.isFullscreen ? 'Во весь экран': 'Выйти из полноэкранного режима' }>
								{ !playerState.isFullscreen ? <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
									<path d="M9.8 6.07967e-06C9.24771 7.03335e-06 8.8 0.447723 8.8 1.00001C8.8 1.55229 9.24772 2.00001 9.8 2.00001L9.8 6.07967e-06ZM13.4 1V0H13.4L13.4 1ZM14 6.2C14 6.75229 14.4477 7.2 15 7.2C15.5523 7.2 16 6.75229 16 6.2H14ZM6.2 16C6.75228 16 7.2 15.5523 7.2 15C7.2 14.4477 6.75229 14 6.2 14L6.2 16ZM2.6 15L2.6 14H2.6L2.6 15ZM1 13.4H0H1ZM2 9.8C2 9.24772 1.55228 8.8 1 8.8C0.447715 8.8 5.96046e-08 9.24772 5.96046e-08 9.8H2ZM9.8 2.00001L13.4 2L13.4 0L9.8 6.07967e-06L9.8 2.00001ZM14 2.6V6.2H16V2.6H14ZM13.4 2C13.7314 2 14 2.26863 14 2.6H16C16 1.16406 14.8359 0 13.4 0V2ZM6.2 14L2.6 14L2.6 16L6.2 16L6.2 14ZM2 13.4L2 9.8H5.96046e-08L0 13.4H2ZM2.6 14C2.26863 14 2 13.7314 2 13.4H0C1.19209e-07 14.8359 1.16406 16 2.6 16L2.6 14Z"/>
								</svg>
								: <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
									<path d="M17 7.33333C17.5523 7.33333 18 6.88561 18 6.33333C18 5.78104 17.5523 5.33333 17 5.33333L17 7.33333ZM13.3077 6.33334L13.3077 7.33334L13.3077 7.33334L13.3077 6.33334ZM11.6667 4.69231L12.6667 4.69231L12.6667 4.69231L11.6667 4.69231ZM12.6667 1C12.6667 0.447715 12.219 -1.42648e-07 11.6667 0C11.1144 1.42648e-07 10.6667 0.447716 10.6667 1L12.6667 1ZM1 10.6667C0.447717 10.6667 9.98537e-07 11.1144 0 11.6667C-9.98533e-07 12.219 0.447713 12.6667 0.999998 12.6667L1 10.6667ZM4.69231 11.6667L4.69231 12.6667H4.69231V11.6667ZM6.33333 13.3077L7.33333 13.3077V13.3077H6.33333ZM5.33333 17C5.33333 17.5523 5.78105 18 6.33333 18C6.88562 18 7.33333 17.5523 7.33333 17L5.33333 17ZM17 5.33333L13.3077 5.33334L13.3077 7.33334L17 7.33333L17 5.33333ZM12.6667 4.69231L12.6667 1L10.6667 1L10.6667 4.69231L12.6667 4.69231ZM13.3077 5.33334C12.9537 5.33334 12.6667 5.04634 12.6667 4.69231L10.6667 4.69231C10.6667 6.15091 11.8491 7.33334 13.3077 7.33334L13.3077 5.33334ZM0.999998 12.6667L4.69231 12.6667L4.69231 10.6667L1 10.6667L0.999998 12.6667ZM5.33333 13.3077L5.33333 17L7.33333 17L7.33333 13.3077L5.33333 13.3077ZM4.69231 12.6667C5.04634 12.6667 5.33333 12.9537 5.33333 13.3077H7.33333C7.33333 11.8491 6.1509 10.6667 4.69231 10.6667V12.6667Z"/>
								</svg> }
							</div> }

						</div>
					</div>
				</div>
				


			</div>

			<Playlist items={playlist} currentMedia={playerState.currentMedia} setCurrentMedia={setCurrentMedia} />
		</div>
	)
}
