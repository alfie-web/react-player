import React, { Fragment, useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import Fullscreen from "react-full-screen";
import './Player.sass';

import { PlayerTitle, Playlist, Volume } from '../';
import timeToFormat from '../../helpers/timeToFormat';

// Обрабатывать ошибки - (Например если видео не существует и тд)
// TODO: Сделать спрайт из иконок и компонент PlayerIcon

const PlayIcon = ({isPlaying}) => {
	return (
		<Fragment>
			{ !isPlaying ? <svg viewBox="0 0 16 18" xmlns="http://www.w3.org/2000/svg">
				<path fillRule="evenodd" clipRule="evenodd" d="M13 8.99994L2.5 2.93777L2.5 15.0621L13 8.99994ZM15.5 9.86597C16.1667 9.48107 16.1667 8.51882 15.5 8.13392L2 0.339689C1.33333 -0.045211 0.500002 0.435916 0.500002 1.20572L0.500001 16.7942C0.500001 17.564 1.33334 18.0451 2 17.6602L15.5 9.86597Z"/>
			</svg>
			: <svg viewBox="0 0 15 18" xmlns="http://www.w3.org/2000/svg">
				<path d="M0 1C0 0.447716 0.447715 0 1 0C1.55228 0 2 0.447715 2 1V17C2 17.5523 1.55228 18 1 18C0.447715 18 0 17.5523 0 17V1Z"/>
				<path d="M13 1C13 0.447716 13.4477 0 14 0C14.5523 0 15 0.447715 15 1V17C15 17.5523 14.5523 18 14 18C13.4477 18 13 17.5523 13 17V1Z"/>
			</svg> }
		</Fragment>
	)
}


export default function Player({ isAudio, playlist, hotKeys = {}, className }) {
	const [playerState, setPlayerState] = useState({
		currentMedia: playlist[0] || {},	// Возможно придется отделить эту штуку в отдельный useState
		currentVolume: 1,

		isLoaded: false,
		isPlaying: false,
		isLooped: false,
		// isEnded: false,
		// isMuted: false,
		// isFullscreen: false	// Возможно вынесем в отдельный стэйт
	})
	const [isFullscreen, setIsFullscreen] = useState(false);

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


	


	// Выбираю активный медиафайл
	const setCurrentMedia = media => {
		setState({
			currentMedia: media,
			isPlaying: false
		})
		mediaRef.current.load();	// Если завыпендривается, то вынесем в useEffect
		console.log('LOADED')
	}



	const prevNextHandler = way => {
		const curIndex = playlist.findIndex((el) => el._id === playerState.currentMedia._id);

		if (curIndex + way > playlist.length - 1) {
			return setCurrentMedia(playlist[0]);
		} else if (curIndex + way < 0) {
			setCurrentMedia(playlist[playlist.length - 1]);
		} else {
			setCurrentMedia(playlist[curIndex + way]);
		}
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

		if (!playerState.isPlaying) play();
	}

	const play = () => {
		// if (!playerState.isPlaying && playerState.isLoaded) {
		if (playerState.isLoaded) {
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

	const playPauseHandler = () => {
		if (playerState.isPlaying) {
			pause();
		} else {
			play();
		}
	}

	const handleEnd = () => {
		setState({ isPlaying: false });

		console.log('END')
		if (playerState.isLooped) {
			play();
		} else {
			prevNextHandler(1);
			// play();
		}
	}


	const loopHandler = () => {
		setState({ isLooped: !playerState.isLooped })
	}



	const onTimeUpdate = () => {
		let currentTime = mediaRef.current.currentTime;
		const duration = playerState.currentMedia.duration;

		timeRef.current.textContent = timeToFormat(currentTime);

		let progress = (currentTime / duration) * 100;
		progressRef.current.style.width = progress + '%';

		// Скорее бедет в отдельном useEffect событие ended
		if (mediaRef.current.ended) {
			handleEnd();
		}
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

	const onRewind = (e, time) => {
		const ref = mediaRef.current;
		if (playerState.isLoaded) {
			console.log('rewind')
			if (!time) {	// Значит кликнули по шкале а не клавишей перемотали
				const [sec] = makeRewindCalculation(e);
				return ref.currentTime = sec;
			} 

			if (ref.currentTime + time < 0) {	// Если перемотали в минусовое время
				return ref.currentTime = 0;
			}

			if (ref.currentTime + time > playerState.currentMedia.duration) {	// Если перемотали в плюсовое время
				return prevNextHandler(1);	// Следующий медиа
			}

			ref.currentTime += time;	// Иначе обычная перемотка на указанное
		}
	}

	const showTimeHint = (e) => {
		const [sec, xproc] = makeRewindCalculation(e);

		hintRef.current.style.left = xproc + '%';
		hintRef.current.textContent = sec ? timeToFormat(sec) : '00:00';	
	}



	const hotKeysHandler = (e) => {
		e.preventDefault();
		const key = e.keyCode;
		const { playPause, mute, loop, fullscreen, volumeUp, volumeDown, next, prev, rewindForward, rewindBack } = hotKeys;

		switch (key) {
			case playPause || 32:	// 32 - space
				playPauseHandler();
				break;
			case loop || 76:	// L
				loopHandler();
				break;
			case fullscreen || 70:	// F
				setIsFullscreen(!isFullscreen);
				break;
			case next || 86:	// V
				prevNextHandler(1)
				break;
			case prev || 67:	// C
				prevNextHandler(-1)
				break;
			case rewindForward || 39:	// ArrowRight
				onRewind(null, 5);
				break;
			case rewindBack || 37:	// ArrowLeft
				onRewind(null, -5);
				break;
			case volumeUp || 78:	// N
				
				break;
			case volumeDown || 66:	// B
				
				break;
			default: return;
		}

		// if (key === playPause || 32) {		// 32 - space
		// 	playPauseHandler();
		// } else if (key === loop || 76) {		// L
		// 	loopHandler();
		// } else if (key === fullscreen || 70) {		// F
		// 	setIsFullscreen(!isFullscreen)
		// } else if (key === next || 86) {		// V
		// 	prevNextHandler(1)
		// } else if (key === prev || 67) {		// C
		// 	prevNextHandler(-1)
		// } else if (key === volumeUp || 78) {		// N

		// } else if (key === volumeDown || 66) {		// B

		// }
	}





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

	


	// От этих вещей избавиться, сделать инлайново
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


	useEffect(() => {
		document.addEventListener('keydown', hotKeysHandler);
		return () => document.removeEventListener('keydown', hotKeysHandler);
	})

	


	// TODO: Может всё-таки разделить вёрстку на 2 компонента Audio и Video
	// TODO: Повыносить всё так же как PlayerTitle
	return (
		<div className="Player__container">
		<Fullscreen
			enabled={isFullscreen}
			onChange={isFull => setIsFullscreen(isFull)}
		>
			<div className={classNames('Player', className, {'Player--audio': isAudio, 'Player--video': !isAudio})}>

				<PlayerTitle title={playerState.currentMedia.title || 'Название медиа'} />

				{ isAudio 
					? <audio ref={mediaRef} src={playerState.currentMedia.url || ''}></audio>
					: <div className="Player__display">
						<video ref={mediaRef} src={playerState.currentMedia.url || ''}></video>
						<div onClick={playPauseHandler} className={classNames('Player__overlay', { 'Player__overlay--paused': !playerState.isPlaying })}>
							<span><PlayIcon isPlaying={playerState.isPlaying} /></span>
						</div>
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
								onClick={playPauseHandler}
							>
								<PlayIcon isPlaying={playerState.isPlaying} />
							</div>

							<div className="Player__prev Player__btn" title="Предыдущий" onClick={() => prevNextHandler(-1)}>
								<svg viewBox="0 0 15 16" xmlns="http://www.w3.org/2000/svg">
									<path fillRule="evenodd" clipRule="evenodd" d="M0 1.05555C0 1.05555 0 1.05555 0 1.05555C7.08679e-07 0.595313 0.373096 0.222215 0.833333 0.222215C1.29357 0.222215 1.66667 0.595311 1.66667 1.05555V7.03774L13.5 0.205764C14.1667 -0.179137 15 0.301989 15 1.07179L15 14.9282C15 15.698 14.1667 16.1791 13.5 15.7942L1.66667 8.96224V14.9444C1.66667 15.4047 1.29357 15.7778 0.833333 15.7778C0.373096 15.7778 0 15.4047 0 14.9444V1.05555ZM4 7.99999L13 13.1961L13 2.80384L4 7.99999Z"/>
								</svg>
							</div>
							<div className="Player__next Player__btn" title="Следующий" onClick={() => prevNextHandler(1)}>
								<svg viewBox="0 0 15 16" xmlns="http://www.w3.org/2000/svg">
									<path fillRule="evenodd" clipRule="evenodd" d="M13.3333 7.03774V1.05555C13.3333 0.595311 13.7064 0.222215 14.1667 0.222215C14.6269 0.222215 15 0.595312 15 1.05555V14.9444C15 15.4047 14.6269 15.7778 14.1667 15.7778C13.7064 15.7778 13.3333 15.4047 13.3333 14.9444V8.96224L1.5 15.7942C0.833334 16.1791 0 15.698 0 14.9282V1.07179C0 0.301989 0.833334 -0.179137 1.5 0.205764L13.3333 7.03774ZM11 7.99999L2 2.80384L2 13.1961L11 7.99999Z"/>
								</svg>
							</div>
							<div className={classNames('Player__loop Player__btn', {'Player__btn--active': playerState.isLooped})} title="Зациклить" onClick={loopHandler}>
								<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
									<path d="M19.4603 7.52466C19.0355 7.28678 18.5174 7.37516 18.1921 7.70708C17.1697 3.71757 13.5439 0.759888 9.24011 0.759888C4.1451 0.759888 0 4.90499 0 10C0 15.095 4.1451 19.2401 9.24011 19.2401C11.4657 19.2401 13.6159 18.4375 15.2947 16.9802C15.7347 16.5982 15.7818 15.9318 15.3998 15.4918C15.0178 15.0518 14.3515 15.0047 13.9114 15.3866C12.6164 16.5108 10.9575 17.1298 9.24011 17.1298C5.3087 17.1298 2.11022 13.9314 2.11022 9.99995C2.11022 6.06853 5.3087 2.87011 9.24011 2.87011C12.3948 2.87011 15.0771 4.92978 16.014 7.77488C15.6581 7.59057 15.2127 7.6173 14.8768 7.881C14.4185 8.24089 14.3387 8.90415 14.6986 9.36245L16.443 11.5837C16.6837 11.8902 17.0419 12.0665 17.4154 12.0665C17.446 12.0665 17.4767 12.0653 17.5075 12.0629C17.9136 12.0313 18.2791 11.7928 18.4851 11.4249L19.8652 8.96079C20.15 8.45237 19.9687 7.80943 19.4603 7.52466Z"/>
									<path d="M9.21856 4.6172C8.63582 4.6172 8.16765 5.08957 8.16765 5.67231V9.73448C8.16765 10.4617 8.75277 11.0779 9.48937 11.0779H12.4266C13.0094 11.0779 13.4818 10.6097 13.4818 10.027C13.4818 9.44421 13.0094 8.97605 12.4266 8.97605H10.2694V5.67231C10.2695 5.08957 9.80131 4.6172 9.21856 4.6172Z"/>
								</svg>
							</div>
							{/* <div className="Player__ddd Player__btn" title="Ggg" onClick={() => onRewind(null, -5)}>
								-5 сек
							</div>
							<div className="Player__ddd Player__btn" title="Ggg" onClick={() => onRewind(null, 5)}>
								+5 сек
							</div> */}
							
							
							<div className="Player__duration"><span ref={timeRef}>00:00</span> / { playerState.currentMedia.duration ? timeToFormat(playerState.currentMedia.duration) : '00:00' }</div>
						</div>

						<div className="Player__controls-right">
							<Volume
								mediaRef={mediaRef}
								startVolume={50}
							/>

							{ !isAudio && <div className="Player__fullscreen Player__btn" onClick={() => setIsFullscreen(!isFullscreen)} title={ !isFullscreen ? 'Во весь экран': 'Выйти из полноэкранного режима' }>
								{ !isFullscreen ? <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
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

			</Fullscreen>

			<Playlist items={playlist} currentMedia={playerState.currentMedia} setCurrentMedia={setCurrentMedia} />
		</div>
	)
}
