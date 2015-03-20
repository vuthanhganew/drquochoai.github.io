/*
	By Osvaldas Valutis, www.osvaldas.info
	Available for use under the MIT License
*/



;(function( $, window, document, undefined )
{
	var isTouch		  = 'ontouchstart' in window,
		eStart		  = isTouch ? 'touchstart'	: 'mousedown',
		eMove		  = isTouch ? 'touchmove'	: 'mousemove',
		eEnd		  = isTouch ? 'touchend'	: 'mouseup',
		eCancel		  = isTouch ? 'touchcancel'	: 'mouseup',
		secondsToTime = function( secs )
		{
			var hoursDiv = secs / 3600, hours = Math.floor( hoursDiv ), minutesDiv = secs % 3600 / 60, minutes = Math.floor( minutesDiv ), seconds = Math.ceil( secs % 3600 % 60 );
			if( seconds > 59 ) { seconds = 0; minutes = Math.ceil( minutesDiv ); }
			if( minutes > 59 ) { minutes = 0; hours = Math.ceil( hoursDiv ); }
			return ( hours == 0 ? '' : hours > 0 && hours.toString().length < 2 ? '0'+hours+':' : hours+':' ) + ( minutes.toString().length < 2 ? '0'+minutes : minutes ) + ':' + ( seconds.toString().length < 2 ? '0'+seconds : seconds );
		},
		canPlayType	  = function( file )
		{
			var audioElement = document.createElement( 'audio' );
			return !!( audioElement.canPlayType && audioElement.canPlayType( 'audio/' + file.split( '.' ).pop().toLowerCase() + ';' ).replace( /no/, '' ) );
		};

	$.fn.audioPlayer = function( params )
	{
		var params		= $.extend( { classPrefix: 'audioplayer', strPlay: 'Play', strPause: 'Pause', strVolume: 'Volume' }, params ),
			cssClass	= {},
			cssClassSub =
			{
				playPause:	 	'playpause',
				playing:		'playing',
				stopped:		'stopped',
				time:		 	'time',
				timeCurrent:	'time-current',
				timeDuration: 	'time-duration',
				bar: 			'bar',
				barLoaded:		'bar-loaded',
				barPlayed:		'bar-played',
				volume:		 	'volume',
				volumeButton: 	'volume-button',
				volumeAdjust: 	'volume-adjust',
				noVolume: 		'novolume',
				muted: 			'muted',
				mini: 			'mini'
			};

		for( var subName in cssClassSub )
			cssClass[ subName ] = params.classPrefix + '-' + cssClassSub[ subName ];

		this.each( function()
		{
			if( $( this ).prop( 'tagName' ).toLowerCase() != 'audio' )
				return false;

			var $this	   = $( this ),
				audioFile  = $this.attr( 'src' ),
				isAutoPlay = $this.get( 0 ).getAttribute( 'autoplay' ), isAutoPlay = isAutoPlay === '' || isAutoPlay === 'autoplay' ? true : false,
				isLoop	   = $this.get( 0 ).getAttribute( 'loop' ),		isLoop	   = isLoop		=== '' || isLoop	 === 'loop'		? true : false,
				isSupport  = false;

			if( typeof audioFile === 'undefined' )
			{
				$this.find( 'source' ).each( function()
				{
					audioFile = $( this ).attr( 'src' );
					if( typeof audioFile !== 'undefined' && canPlayType( audioFile ) )
					{
						isSupport = true;
						return false;
					}
				});
			}
			else if( canPlayType( audioFile ) ) isSupport = true;

			var thePlayer = $( '<div class="' + params.classPrefix + '">' + ( isSupport ? $( '<div>' ).append( $this.eq( 0 ).clone() ).html() : '<embed src="' + audioFile + '" width="0" height="0" volume="100" autostart="' + isAutoPlay.toString() +'" loop="' + isLoop.toString() + '" />' ) + '<div class="' + cssClass.playPause + '" title="' + params.strPlay + '"><a href="#">' + params.strPlay + '</a></div></div>' ),
				theAudio  = isSupport ? thePlayer.find( 'audio' ) : thePlayer.find( 'embed' ), theAudio = theAudio.get( 0 );

			if( isSupport )
			{
				thePlayer.find( 'audio' ).css( { 'width': 0, 'height': 0, 'visibility': 'hidden' } );
				thePlayer.append( '<div class="' + cssClass.time + ' ' + cssClass.timeCurrent + '"></div><div class="' + cssClass.bar + '"><div class="' + cssClass.barLoaded + '"></div><div class="' + cssClass.barPlayed + '"></div></div><div class="' + cssClass.time + ' ' + cssClass.timeDuration + '"></div><div class="' + cssClass.volume + '"><div class="' + cssClass.volumeButton + '" title="' + params.strVolume + '"><a href="#">' + params.strVolume + '</a></div><div class="' + cssClass.volumeAdjust + '"><div><div></div></div></div></div>' );

				var theBar			  = thePlayer.find( '.' + cssClass.bar ),
					barPlayed	 	  = thePlayer.find( '.' + cssClass.barPlayed ),
					barLoaded	 	  = thePlayer.find( '.' + cssClass.barLoaded ),
					timeCurrent		  = thePlayer.find( '.' + cssClass.timeCurrent ),
					timeDuration	  = thePlayer.find( '.' + cssClass.timeDuration ),
					volumeButton	  = thePlayer.find( '.' + cssClass.volumeButton ),
					volumeAdjuster	  = thePlayer.find( '.' + cssClass.volumeAdjust + ' > div' ),
					volumeDefault	  = 0,
					adjustCurrentTime = function( e )
					{
						theRealEvent		 = isTouch ? e.originalEvent.touches[ 0 ] : e;
						theAudio.currentTime = Math.round( ( theAudio.duration * ( theRealEvent.pageX - theBar.offset().left ) ) / theBar.width() );
					},
					adjustVolume = function( e )
					{
						theRealEvent	= isTouch ? e.originalEvent.touches[ 0 ] : e;
						theAudio.volume = Math.abs( ( theRealEvent.pageY - ( volumeAdjuster.offset().top + volumeAdjuster.height() ) ) / volumeAdjuster.height() );
					},
					updateLoadBar = function()
					{
						var interval = setInterval( function()
						{
							if( theAudio.buffered.length < 1 ) return true;
							barLoaded.width( ( theAudio.buffered.end( 0 ) / theAudio.duration ) * 100 + '%' );
							if( Math.floor( theAudio.buffered.end( 0 ) ) >= Math.floor( theAudio.duration ) ) clearInterval( interval );
						}, 100 );
					};

				var volumeTestDefault = theAudio.volume, volumeTestValue = theAudio.volume = 0.111;
				if( Math.round( theAudio.volume * 1000 ) / 1000 == volumeTestValue ) theAudio.volume = volumeTestDefault;
				else thePlayer.addClass( cssClass.noVolume );

				timeDuration.html( '&hellip;' );
				timeCurrent.html( secondsToTime( 0 ) );

				theAudio.addEventListener( 'loadeddata', function()
				{
					updateLoadBar();
					timeDuration.html( $.isNumeric( theAudio.duration ) ? secondsToTime( theAudio.duration ) : '&hellip;' );
					volumeAdjuster.find( 'div' ).height( theAudio.volume * 100 + '%' );
					volumeDefault = theAudio.volume;
				});

				theAudio.addEventListener( 'timeupdate', function()
				{
					timeCurrent.html( secondsToTime( theAudio.currentTime ) );
					barPlayed.width( ( theAudio.currentTime / theAudio.duration ) * 100 + '%' );
				});

				theAudio.addEventListener( 'volumechange', function()
				{
					volumeAdjuster.find( 'div' ).height( theAudio.volume * 100 + '%' );
					if( theAudio.volume > 0 && thePlayer.hasClass( cssClass.muted ) ) thePlayer.removeClass( cssClass.muted );
					if( theAudio.volume <= 0 && !thePlayer.hasClass( cssClass.muted ) ) thePlayer.addClass( cssClass.muted );
				});

				theAudio.addEventListener( 'ended', function()
				{
					thePlayer.removeClass( cssClass.playing ).addClass( cssClass.stopped );
				});

				theBar.on( eStart, function( e )
				{
					adjustCurrentTime( e );
					theBar.on( eMove, function( e ) { adjustCurrentTime( e ); } );
				})
				.on( eCancel, function()
				{
					theBar.unbind( eMove );
				});

				volumeButton.on( 'click', function()
				{
					if( thePlayer.hasClass( cssClass.muted ) )
					{
						thePlayer.removeClass( cssClass.muted );
						theAudio.volume = volumeDefault;
					}
					else
					{
						thePlayer.addClass( cssClass.muted );
						volumeDefault = theAudio.volume;
						theAudio.volume = 0;
					}
					return false;
				});

				volumeAdjuster.on( eStart, function( e )
				{
					adjustVolume( e );
					volumeAdjuster.on( eMove, function( e ) { adjustVolume( e ); } );
				})
				.on( eCancel, function()
				{
					volumeAdjuster.unbind( eMove );
				});
			}
			else thePlayer.addClass( cssClass.mini );

			thePlayer.addClass( isAutoPlay ? cssClass.playing : cssClass.stopped );

			thePlayer.find( '.' + cssClass.playPause ).on( 'click', function()
			{
				if( thePlayer.hasClass( cssClass.playing ) )
				{
					$( this ).attr( 'title', params.strPlay ).find( 'a' ).html( params.strPlay );
					thePlayer.removeClass( cssClass.playing ).addClass( cssClass.stopped );
					isSupport ? theAudio.pause() : theAudio.Stop();
				}
				else
				{
					$( this ).attr( 'title', params.strPause ).find( 'a' ).html( params.strPause );
					thePlayer.addClass( cssClass.playing ).removeClass( cssClass.stopped );
					isSupport ? theAudio.play() : theAudio.Play();
				}
				return false;
			});
			$this.replaceWith( thePlayer );
		});
		document.write('<style>.audioplayer 		{ 			height: 2.5em; /* 40 */ 			color: #fff; 			text-shadow: 1px 1px 0 #000; 			border: 1px solid #222; 			position: relative; 			z-index: 1; 			background: #333; 		}   			/* mini mode (fallback) */  			.audioplayer-mini 			{ 				width: 2.5em; /* 40 */ 				margin: 0 auto; 			}   			/* player elements: play/pause and volume buttons, played/duration timers, progress bar of loaded/played */  			.audioplayer > div 			{ 				position: absolute; 			}   			/* play/pause button */  			.audioplayer-playpause 			{ 				width: 2.5em; /* 40 */ 				height: 100%; 				text-align: left; 				text-indent: -9999px; 				cursor: pointer; 				z-index: 2; 				top: 0; 				left: 0; 			} 				.audioplayer:not(.audioplayer-mini) .audioplayer-playpause 				{ 					border-right: 1px solid #555; 					border-right-color: rgba( 255, 255, 255, .1 ); 				} 				.audioplayer-mini .audioplayer-playpause 				{ 					width: 100%; 				} 				.audioplayer-playpause:hover, 				.audioplayer-playpause:focus 				{ 					background-color: #222; 				} 				.audioplayer-playpause a 				{ 					display: block; 				} 				.audioplayer-stopped .audioplayer-playpause a 				{ 					width: 0; 					height: 0; 					border: 0.5em solid transparent; /* 8 */ 					border-right: none; 					border-left-color: #fff; 					content: ""; 					position: absolute; 					top: 50%; 					left: 50%; 					margin: -0.5em 0 0 -0.25em; /* 8 4 */ 				} 				.audioplayer-playing .audioplayer-playpause a 				{ 					width: 0.75em; /* 12 */ 					height: 0.75em; /* 12 */ 					position: absolute; 					top: 50%; 					left: 50%; 					margin: -0.375em 0 0 -0.375em; /* 6 */ 				} 					.audioplayer-playing .audioplayer-playpause a:before, 					.audioplayer-playing .audioplayer-playpause a:after 					{ 						width: 40%; 						height: 100%; 						background-color: #fff; 						content: ""; 						position: absolute; 						top: 0; 					} 					.audioplayer-playing .audioplayer-playpause a:before 					{ 						left: 0; 					} 					.audioplayer-playing .audioplayer-playpause a:after 					{ 						right: 0; 					}   			/* timers */  			.audioplayer-time 			{ 				width: 4.375em; /* 70 */ 				height: 100%; 				line-height: 2.375em; /* 38 */ 				text-align: center; 				z-index: 2; 				top: 0; 			} 				.audioplayer-time-current 				{ 					border-left: 1px solid #111; 					border-left-color: rgba( 0, 0, 0, .25 ); 					left: 2.5em; /* 40 */ 				} 				.audioplayer-time-duration 				{ 					border-right: 1px solid #555; 					border-right-color: rgba( 255, 255, 255, .1 ); 					right: 2.5em; /* 40 */ 				} 					.audioplayer-novolume .audioplayer-time-duration 					{ 						border-right: 0; 						right: 0; 					}   			/* progress bar of loaded/played */  			.audioplayer-bar 			{ 				height: 0.875em; /* 14 */ 				background-color: #222; 				cursor: pointer; 				z-index: 1; 				top: 50%; 				right: 6.875em; /* 110 */ 				left: 6.875em; /* 110 */ 				margin-top: -0.438em; /* 7 */ 			} 				.audioplayer-novolume .audioplayer-bar 				{ 					right: 4.375em; /* 70 */ 				} 				.audioplayer-bar div 				{ 					width: 0; 					height: 100%; 					position: absolute; 					left: 0; 					top: 0; 				} 				.audioplayer-bar-loaded 				{ 					background-color: #333; 					z-index: 1; 				} 				.audioplayer-bar-played 				{ 					background: #007fd1; 					z-index: 2; 				}   			/* volume button */  			.audioplayer-volume 			{ 				width: 2.5em; /* 40 */ 				height: 100%; 				border-left: 1px solid #111; 				border-left-color: rgba( 0, 0, 0, .25 ); 				text-align: left; 				text-indent: -9999px; 				cursor: pointer; 				z-index: 2; 				top: 0; 				right: 0; 			} 				.audioplayer-volume:hover, 				.audioplayer-volume:focus 				{ 					background-color: #222; 				} 				.audioplayer-volume-button 				{ 					width: 100%; 					height: 100%; 				} 					.audioplayer-volume-button a 					{ 						width: 0.313em; /* 5 */ 						height: 0.375em; /* 6 */ 						background-color: #fff; 						display: block; 						position: relative; 						z-index: 1; 						top: 40%; 						left: 35%; 					} 						.audioplayer-volume-button a:before, 						.audioplayer-volume-button a:after 						{ 							content: ""; 							position: absolute; 						} 						.audioplayer-volume-button a:before 						{ 							width: 0; 							height: 0; 							border: 0.5em solid transparent; /* 8 */ 							border-left: none; 							border-right-color: #fff; 							z-index: 2; 							top: 50%; 							right: -0.25em; 							margin-top: -0.5em; /* 8 */ 						} 						.audioplayer:not(.audioplayer-muted) .audioplayer-volume-button a:after 						{ 							/* "volume" icon by Nicolas Gallagher, http://nicolasgallagher.com/pure-css-gui-icons */ 							width: 0.313em; /* 5 */ 							height: 0.313em; /* 5 */ 							border: 0.25em double #fff; /* 4 */ 							border-width: 0.25em 0.25em 0 0; /* 4 */ 							left: 0.563em; /* 9 */ 							top: -0.063em; /* 1 */ 							-webkit-border-radius: 0 0.938em 0 0; /* 15 */ 							-moz-border-radius: 0 0.938em 0 0; /* 15 */ 							border-radius: 0 0.938em 0 0; /* 15 */ 							-webkit-transform: rotate( 45deg ); 							-moz-transform: rotate( 45deg ); 							-ms-transform: rotate( 45deg ); 							-o-transform: rotate( 45deg ); 							transform: rotate( 45deg ); 						}   				/* volume dropdown */  				.audioplayer-volume-adjust 				{ 					height: 6.25em; /* 100 */ 					cursor: default; 					position: absolute; 					left: 0; 					right: -1px; 					top: -9999px; 					background: #333; 				} 					.audioplayer-volume:not(:hover) .audioplayer-volume-adjust 					{ 						opacity: 0; 					} 					.audioplayer-volume:hover .audioplayer-volume-adjust 					{ 						top: auto; 						bottom: 100%; 					} 					.audioplayer-volume-adjust > div 					{ 						width: 40%; 						height: 80%; 						background-color: #222; 						cursor: pointer; 						position: relative; 						z-index: 1; 						margin: 30% auto 0; 					} 						.audioplayer-volume-adjust div div 						{ 							width: 100%; 							height: 100%; 							position: absolute; 							bottom: 0; 							left: 0; 							background: #007fd1; 						} 				.audioplayer-novolume .audioplayer-volume 				{ 					display: none; 				}   			/* CSS3 decorations */  			body 			{ 				-webkit-box-shadow: inset 0 0 18.75em rgba( 0, 0, 0, .5 ); /* 300 */ 				-moz-box-shadow: inset 0 0 18.75em rgba( 0, 0, 0, 5 ); /* 300 */ 				box-shadow: inset 0 0 18.75em rgba( 0, 0, 0, .5 ); /* 300 */ 			} 			.audioplayer 			{ 				-webkit-box-shadow: inset 0 1px 0 rgba( 255, 255, 255, .15 ), 0 0 1.25em rgba( 0, 0, 0, .5 ); /* 20 */ 				-moz-box-shadow: inset 0 1px 0 rgba( 255, 255, 255, .15 ), 0 0 1.25em rgba( 0, 0, 0, .5 ); /* 20 */ 				box-shadow: inset 0 1px 0 rgba( 255, 255, 255, .15 ), 0 0 1.25em rgba( 0, 0, 0, .5 ); /* 20 */ 			} 			.audioplayer-volume-adjust 			{ 				-webkit-box-shadow: -2px -2px 2px rgba( 0, 0, 0, .15 ), 2px -2px 2px rgba( 0, 0, 0, .15 ); 				-moz-box-shadow: -2px -2px 2px rgba( 0, 0, 0, .15 ), 2px -2px 2px rgba( 0, 0, 0, .15 ); 				box-shadow: -2px -2px 2px rgba( 0, 0, 0, .15 ), 2px -2px 2px rgba( 0, 0, 0, .15 ); 			} 			.audioplayer-bar, 			.audioplayer-volume-adjust > div 			{ 				-webkit-box-shadow: -1px -1px 0 rgba( 0, 0, 0, .5 ), 1px 1px 0 rgba( 255, 255, 255, .1 ); 				-moz-box-shadow: -1px -1px 0 rgba( 0, 0, 0, .5 ), 1px 1px 0 rgba( 255, 255, 255, .1 ); 				box-shadow: -1px -1px 0 rgba( 0, 0, 0, .5 ), 1px 1px 0 rgba( 255, 255, 255, .1 ); 			} 			.audioplayer-volume-adjust div div, 			.audioplayer-bar-played 			{ 				-webkit-box-shadow: inset 0 0 5px rgba( 255, 255, 255, .5 ); 				-moz-box-shadow: inset 0 0 5px rgba( 255, 255, 255, .5 ); 				box-shadow: inset 0 0 5px rgba( 255, 255, 255, .5 ); 			} 			.audioplayer-playpause, 			.audioplayer-volume a 			{ 				-webkit-filter: drop-shadow( 1px 1px 0 #000 ); 				-moz-filter: drop-shadow( 1px 1px 0 #000 ); 				-ms-filter: drop-shadow( 1px 1px 0 #000 ); 				-o-filter: drop-shadow( 1px 1px 0 #000 ); 				filter: drop-shadow( 1px 1px 0 #000 ); 			} 			.audioplayer, 			.audioplayer-volume-adjust 			{ 				background: -webkit-gradient( linear, left top, left bottom, from( #444 ), to( #222 ) ); 				background: -webkit-linear-gradient( top, #444, #222 ); 				background: -moz-linear-gradient( top, #444, #222 ); 				background: -ms-radial-gradient( top, #444, #222 ); 				background: -o-linear-gradient( top, #444, #222 ); 				background: linear-gradient( to bottom, #444, #222 ); 			} 			.audioplayer-bar-played 			{ 				background: -webkit-gradient( linear, left top, right top, from( #007fd1 ), to( #c600ff ) ); 				background: -webkit-linear-gradient( left, #007fd1, #c600ff ); 				background: -moz-linear-gradient( left, #007fd1, #c600ff ); 				background: -ms-radial-gradient( left, #007fd1, #c600ff ); 				background: -o-linear-gradient( left, #007fd1, #c600ff ); 				background: linear-gradient( to right, #007fd1, #c600ff ); 			} 			.audioplayer-volume-adjust div div 			{ 				background: -webkit-gradient( linear, left bottom, left top, from( #007fd1 ), to( #c600ff ) ); 				background: -webkit-linear-gradient( bottom, #007fd1, #c600ff ); 				background: -moz-linear-gradient( bottom, #007fd1, #c600ff ); 				background: -ms-radial-gradient( bottom, #007fd1, #c600ff ); 				background: -o-linear-gradient( bottom, #007fd1, #c600ff ); 				background: linear-gradient( to top, #007fd1, #c600ff ); 			} 			.audioplayer-bar, 			.audioplayer-bar div, 			.audioplayer-volume-adjust div 			{ 				-webkit-border-radius: 4px; 				-moz-border-radius: 4px; 				border-radius: 4px; 			} 			.audioplayer 			{ 				-webkit-border-radius: 2px; 				-moz-border-radius: 2px; 				border-radius: 2px; 			} 			.audioplayer-volume-adjust 			{ 				-webkit-border-top-left-radius: 2px; 				-webkit-border-top-right-radius: 2px; 				-moz-border-radius-topleft: 2px; 				-moz-border-radius-topright: 2px; 				border-top-left-radius: 2px; 				border-top-right-radius: 2px; 			} 			.audioplayer *, 			.audioplayer *:before, 			.audioplayer *:after 			{ 				-webkit-transition: color .25s ease, background-color .25s ease, opacity .5s ease; 				-moz-transition: color .25s ease, background-color .25s ease, opacity .5s ease; 				-ms-transition: color .25s ease, background-color .25s ease, opacity .5s ease; 				-o-transition: color .25s ease, background-color .25s ease, opacity .5s ease; 				transition: color .25s ease, background-color .25s ease, opacity .5s ease; 			}</style>')
		return this;
	};
})( jQuery, window, document );