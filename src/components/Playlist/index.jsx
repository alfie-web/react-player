import React from 'react';
import './Playlist.sass';

import { PlaylistItem } from '../';

export default function Playlist({ items, currentMedia, setCurrentMedia }) {
	return (
		<div className="Player__playlist Playlist">
			{ items.map((item, i ) => (
				<PlaylistItem 
					key={item._id}
					item={item}
					num={i + 1}
					currentMedia={currentMedia}
					setCurrentMedia={setCurrentMedia}
				/>
			)) }
		</div>
	)
}
