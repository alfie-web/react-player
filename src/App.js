import React from 'react';
import './App.css';

import Player from './components/Player';

const MOCKVIDEO = [
	{
		_id: '1',
		url: 'https://res.cloudinary.com/dkbqvhh7f/video/upload/v1587982679/player/Portugal_The_Man_-_Feel_It_Still_Lyrics_egczjs.mp4',
		title: 'Portugal. The Man - Feel it still',
		duration: 166,
		poster: ''
	},
	{
		_id: '2',
		url: 'https://res.cloudinary.com/dkbqvhh7f/video/upload/v1587624470/player/bg_jtawby.mp4',
		title: 'Промо ролик какой-то',
		duration: 133,
		poster: ''
	},
	{
		_id: '3',
		url: 'https://res.cloudinary.com/dkbqvhh7f/video/upload/v1587623677/player/Detroit-_Become_Human_Markus_final_song_Everything_will_be_alright_cbzztz.mp4',
		title: 'Everything will be allright',
		duration: 172,
		poster: ''
	},
];

// const MOCKAUDIO = [
// 	{
// 		_id: '1',
// 		url: 'https://res.cloudinary.com/dkbqvhh7f/video/upload/v1587622967/player/brad_paisley_-_find_yourself_ost_tachki__zv.fm_epk71g.mp3',
// 		title: 'Brad Paisley - Find Yourself',
// 		duration: 251,
// 		poster: ''
// 	},
// 	{
// 		_id: '2',
// 		url: 'https://res.cloudinary.com/dkbqvhh7f/video/upload/v1587622914/player/Syd_Matters_-_Obstacles_yyfkpu.mp3',
// 		title: 'Syd Matters - Obstacles',
// 		duration: 208,
// 		poster: ''
// 	},
// ];

function App() {
	return (
		<div className="App">
			<Player 
				playlist={MOCKVIDEO}
				hotKeys={{		// Желательно чтобы если мы используем 2 плеера, клавиши не пересекались, так как они будут срабатывать для всех плееров // Хотя по идее надо просто как-то проверять над каким плеером фокус
					playPause: 32,	// Пробел
					mute: 77,	// M
					loop: 76, 	// L
					fullscreen: 70, 	// F
					volumeUp: 78,	// N
					volumeDown: 66,		// B
					next: 86, 	// V
					prev: 67,	// C
					rewindForward: 39, 	// ArrowRight
					rewindBack: 37, 	// ArrowLeft
				}}
			/>
			{/* <Player 
				isAudio
				playlist={MOCKAUDIO}
			/> */}
		</div>
	);
}

export default App;
