

const accessKey = '62887a9977msh6d9f7db6857fc54p18f5e0jsn87163960ea8e';
const geniusHost = 'genius-song-lyrics1.p.rapidapi.com';
const spotifyHost = 'spotify23.p.rapidapi.com';

const GENIUS_BASE_URL = 'https://genius-song-lyrics1.p.rapidapi.com';
const GENIUS_OPTIONS = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': accessKey,
        'X-RapidAPI-Host': geniusHost,
    },
};

const SPOTIFY_BASE_URL = 'https://spotify23.p.rapidapi.com';
const SPOTIFY_OPTIONS = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': accessKey,
        'X-RapidAPI-Host': spotifyHost,
    },
};

const navBtns = document.querySelectorAll('[data-nav-btn]');
const lyricsBtn = document.querySelector('[data-nav-btn="lyrics"]');
const otherAlbumsBtn = document.querySelector('[data-nav-btn="other-albums"]');
const relatedArtistBtn = document.querySelector('[data-nav-btn="related-artist"]');
const metaDataWrapper = document.querySelector('[data-metadata]');


const LOCAL_KEYS = {
    trackID: 'trackID',
    trackDetails: 'trackDetails',
    lyrics: 'lyrics',
    otherAlbums: 'otherAlbums',
    relatedArtist: 'relatedArtist',
};


let savedTrackID;
let savedTrackDetails;
let savedLyrics;
let savedOtherAlbums;
let savedRelatedArtist;

const getTrackDetail = async (trackID) => {
    const url = `${SPOTIFY_BASE_URL}/tracks/?ids=${trackID}`;
    console.log(`${SPOTIFY_BASE_URL}/tracks/?ids=${trackID}`);
    try {
        const response = await fetch(url, SPOTIFY_OPTIONS);
        const result = await response.json();

        if (!result) return;

        const id = result.tracks?.[0]?.id ?? 0;
        const name = result.tracks?.[0]?.name ?? 'Unknown artist';
        const albumID = result.tracks?.[0]?.album?.id ?? 0;
        const albumImage =
            result.tracks?.[0]?.album?.images?.[0]?.url ??
            'https://archive.org/download/cover-image_202312/cover-image.png';
        const artistID = result.tracks?.[0]?.artists?.[0]?.id ?? 0;
        const artistName = result.tracks?.[0]?.artists?.[0]?.name ?? 'Unknown song';
        const duration = result?.tracks?.[0]?.duration_ms ?? 0;
        return {
            id,
            album: {
                id: albumID,
                image: albumImage,
            },
            name,
            artist: {
                id: artistID,
                name: artistName,
            },
            duration,
        };
    } catch (error) {
        console.error(error);
    }
};

const getTrackRecommedation = async (songID) => {
    const url = `${BASE_URL}/song/recommendations/?id=${songID}`;

    try {
        const response = await fetch(url, SPOTIFY_OPTIONS);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error(error);
    }
};

const getSongIDByQuery = async (query) => {
    const searchParam = encodeURIComponent(query);
    const url = `${GENIUS_BASE_URL}/search/?q=${searchParam}`;

    try {
        const response = await fetch(url, GENIUS_OPTIONS);
        const result = await response.json();
        console.log(result.hits?.[0]?.result?.id);
        if (!result?.hits || result.hits.length === 0 || !result.hits?.[0]?.result?.id) return null;
        const songID = result.hits[0].result.id;
        return songID;
    } catch (error) {
        console.error(error);
    }
};

const getSongLyrics = async (query) => {
    const songID = await getSongIDByQuery(query);
    if (!songID) return false;
    const url = `${GENIUS_BASE_URL}/song/lyrics/?id=${songID}`;

    try {
        const response = await fetch(url, GENIUS_OPTIONS);
        const result = await response.json();
        if (!result) return "Lyrics for this song isn't available";
        const lyrics = result.lyrics?.lyrics?.body?.html ?? "Lyrics for this song isn't available";
        return {
            searchQuery: query,
            html: lyrics,
        };
    } catch (error) {
        console.error(error);
    }
};

const getArtistAlbum = async (artistID) => {
    
    const url = `${SPOTIFY_BASE_URL}/artist_albums/?id=${artistID}`;

    try {
        const response = await fetch(url, SPOTIFY_OPTIONS);
        const result = await response.json();
        if (!result) return;

        const rawAlbums = result.data?.artist?.discography?.albums?.items ?? [];

        const albums = rawAlbums
            .map((album) => {
                const items = album.releases?.items;
                if (items.length === 0) return {};
                return {
                    id: items[0]?.id,
                    name: items[0]?.name,
                    year: items[0]?.date?.year,
                    cover: items[0]?.coverArt?.sources?.[0]?.url,
                    resourceType: 'album',
                };
            })
            .filter((album) => album.length !== 0);

        return {
            artistID,
            albums,
        };
    } catch (error) {
        console.error(error);
    }
};

const getRelatedArtist = async (artistID) => {
    const url = `${SPOTIFY_BASE_URL}/artist_related/?id=${artistID}`;

    try {
        const response = await fetch(url, SPOTIFY_OPTIONS);
        const result = await response.json();
        if (!result) return;

        const rawArtist = result.artists ?? [];

        const artists = rawArtist
            .map((artist) => {
                return {
                    id: artist?.id,
                    name: artist?.name,
                    cover: artist?.images?.[0]?.url,
                    resourceType: 'artist',
                };
            })
            .filter((album) => album.length !== 0);

        return {
            artistID,
            artists,
        };
    } catch (error) {
        console.error(error);
    }
};

const getSongData = async (songID) => {
    return Promise.all([
        getSongDetails(songID),
        getSongLyrics(songID),
        getSongRecommedation(songID),
    ]);
};

const renderSongCover = (details) => {
    const playerSongCover = document.querySelector('.cover-image');
    if (!playerSongCover) return;
    // if (!details?.tracks || !details?.tracks?.[0]?.album?.images?.[0]?.url) return;

    // const headerImageUrl = details.tracks[0].album.images[0].url;
    const headerImageUrl = details.album.image;
    playerSongCover.src = headerImageUrl;
};

const renderSongArtist = (details) => {
    const playerSongArtist = document.querySelector('.song-artist');
    if (!playerSongArtist) return;
    // if (!details?.tracks || !details?.tracks?.[0].artists?.[0]?.name) return;

    // const artistName = details.tracks[0].artists[0].name;
    const artistName = details.artist.name;
    playerSongArtist.textContent = artistName;
    playerSongArtist.href = `https://open.spotify.com/artist/${details.artist.id}`;
};

const renderSongTitle = (details) => {
    const playerSongTitle = document.querySelector('.song-title');
    if (!playerSongTitle) return;
    // if (!details?.tracks || !details?.tracks?.[0].name) return;

    // const titleName = details.tracks[0].name;
    const titleName = details.name;
    playerSongTitle.textContent = titleName;
};

const renderSongDuration = (details) => {
    const playerSongDurationLeft = document.querySelector('[data-song-duration-right]');
    if (!playerSongDurationLeft) return;
    // if (!details?.tracks || !details?.tracks?.[0].duration_ms) return;

    // const rawDurationInMillisecond = details.tracks[0].duration_ms;
    const rawDurationInMillisecond = details.duration;
    const durationInMinuteAndSecond = msToMinutesAndSeconds(rawDurationInMillisecond);
    playerSongDurationLeft.textContent = durationInMinuteAndSecond;
};

const renderSongLyrics = (lyrics) => {
    if (!metaDataWrapper) return;

    const lyricsToShow = lyrics.html;
    metaDataWrapper.innerHTML = lyricsToShow;
};

const renderOtherAlbums = (otherAlbums) => {
    const albums = otherAlbums?.albums;

    const splide = document.createElement('div');
    splide.classList.add('splide');
    const splideTrack = document.createElement('div');
    splideTrack.classList.add('splide__track');
    const splideList = document.createElement('ul');
    splideList.classList.add('splide__list');

    albums.forEach((album) => {
        const splideSlide = createSplideSlide({
            id: album.id,
            cover: album?.cover ?? 'https://archive.org/download/cover-image_202312/cover-image.png',
            name: album?.name ?? 'Unknown Album',
            year: album?.year ?? '????',
            resourceType: album.resourceType,
        });
        splideList.append(splideSlide);
    });

    splideTrack.append(splideList);
    splide.append(splideTrack);
    metaDataWrapper.replaceChildren(splide);
    initializeSplide();
};

const renderRelatedArtist = (relatedArtist) => {
    const artists = relatedArtist?.artists;

    const splide = document.createElement('div');
    splide.classList.add('splide');
    const splideTrack = document.createElement('div');
    splideTrack.classList.add('splide__track');
    const splideList = document.createElement('ul');
    splideList.classList.add('splide__list');

    artists.forEach((artist) => {
        const splideSlide = createSplideSlide({
            id: artist.id,
            cover: artist?.cover ?? 'https://archive.org/download/cover-image_202312/cover-image.png',
            name: artist?.name ?? 'Unknown Artist',
            year: 'noyear',
            resourceType: artist.resourceType,
        });
        splideList.append(splideSlide);
    });

    splideTrack.append(splideList);
    splide.append(splideTrack);
    metaDataWrapper.replaceChildren(splide);
    initializeSplide();
};

const createSplideSlide = ({ id, cover, name, year, resourceType }) => {
    const splideSlide = document.createElement('article');
    splideSlide.classList.add('splide__slide');

    const anchor = document.createElement('a');
    anchor.classList.add('splide__link');
    anchor.href = `https://open.spotify.com/${resourceType}/${id}`;
    anchor.target = '_blank';

    const slideCover = document.createElement('img');
    slideCover.classList.add('splide__cover');
    slideCover.src = cover;
    slideCover.alt = name;

    const innerWrapperDiv = document.createElement('div');

    const slideTitle = document.createElement('span');
    slideTitle.classList.add('splide__title');
    slideTitle.textContent = name;

    innerWrapperDiv.append(slideTitle);

    if (!(year === 'noyear')) {
        const slideText = document.createElement('time');
        slideText.classList.add('splide__text');
        slideText.textContent = year;
        slideText.datetime = year;

        innerWrapperDiv.append(slideText);
    }

    anchor.append(slideCover, innerWrapperDiv);
    splideSlide.append(anchor);
    return splideSlide;
};

const initializeSplide = () => {
    new Splide('.splide', {
        padding: { right: '6rem' },
        gap: '1rem',
        perPage: 2,
        breakpoints: {
            768: {
                perPage: 1,
            },
        },
    }).mount();
};

const setNavBtnActive = (navBtn) => {
    navBtns.forEach((btns) => btns.classList.remove('active'));
    navBtn.classList.add('active');
};

const msToMinutesAndSeconds = (duration) => {
    let seconds = parseInt((duration / 1000) % 60);
    let minutes = parseInt(duration / (1000 * 60));

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    return minutes + ':' + seconds;
};

const lyricsCB = async (e) => {
    e.preventDefault();
    setNavBtnActive(lyricsBtn);
    document.title = 'Music Player | Lyrics';

    const currentTrackDetails = savedTrackDetails;

    if (!currentTrackDetails) return;

    let currentLyrics = savedLyrics;
    if (!currentLyrics) {
        currentLyrics = await getSongLyrics(
            `${currentTrackDetails?.name} ${currentTrackDetails?.artist?.name}`
        );
        savedLyrics = currentLyrics;
    } else {
        if (
            !(
                `${currentTrackDetails?.name} ${currentTrackDetails?.artist?.name}` ===
                currentLyrics.searchQuery
            )
        ) {
            currentLyrics = await getSongLyrics(
                `${currentTrackDetails?.name} ${currentTrackDetails?.artist?.name}`
            );
            savedLyrics = currentLyrics;
        }
    }
    renderSongLyrics(currentLyrics);
};

const otherAlbumsCB = async (e) => {
    e.preventDefault();
    setNavBtnActive(otherAlbumsBtn);
    document.title = 'Music Player | Other Albums';

    const currentTrackDetails = savedTrackDetails;

    if (!currentTrackDetails) return;

    let currentOtherAlbums = savedOtherAlbums;
    if (!currentOtherAlbums) {
        currentOtherAlbums = await getArtistAlbum(currentTrackDetails?.artist?.id);
        savedOtherAlbums = currentOtherAlbums;
    } else {
        if (!(currentOtherAlbums.artistID === currentTrackDetails.artist.id)) {
            currentOtherAlbums = await getArtistAlbum(currentTrackDetails?.artist?.id);
            savedOtherAlbums = currentOtherAlbums;
        }
    }
    renderOtherAlbums(currentOtherAlbums);
};

const relatedArtistCB = async (e) => {
    e.preventDefault();
    setNavBtnActive(relatedArtistBtn);
    document.title = 'Music Player | Related Artist';

    const currentTrackDetails = savedTrackDetails;

    if (!currentTrackDetails) return;

    let currentRelatedArtist = savedRelatedArtist;
    if (!currentRelatedArtist) {
        currentRelatedArtist = await getRelatedArtist(currentTrackDetails?.artist?.id);
        savedRelatedArtist = currentRelatedArtist;
    } else {
        if (!(currentRelatedArtist.artistID === currentTrackDetails.artist.id)) {
            currentRelatedArtist = await getRelatedArtist(currentTrackDetails?.artist?.id);
            savedRelatedArtist = currentRelatedArtist;
        }
    }
    renderRelatedArtist(currentRelatedArtist);
};

const onDocumentReady = (cb) => {
    if (
        document.readyState === 'complete' ||
        (document.readyState !== 'loading' && !document.documentElement.doScroll)
    ) {
        cb();
    } else {
        document.addEventListener('DOMContentLoaded', cb);
    }
};

onDocumentReady(async () => {
    let currentTrackID = savedTrackID;
    if (!currentTrackID) {
        currentTrackID = '7wuJGgpTNzbUyn26IOY6rj';
        savedTrackID = currentTrackID;


    }

    let currentTrackDetails = savedTrackDetails;
    if (!currentTrackDetails) {
        currentTrackDetails = await getTrackDetail(currentTrackID);
        savedTrackDetails = currentTrackDetails;
    } else {
        if (!(currentTrackDetails.id === currentTrackID)) {
            currentTrackDetails = await getTrackDetail(currentTrackID);
            savedTrackDetails = currentTrackDetails;
        }
    }

    renderSongTitle(currentTrackDetails);
    renderSongArtist(currentTrackDetails);
    renderSongCover(currentTrackDetails);
    renderSongDuration(currentTrackDetails);

    lyricsBtn.addEventListener('click', lyricsCB);

    otherAlbumsBtn.addEventListener('click', otherAlbumsCB);

    relatedArtistBtn.addEventListener('click', relatedArtistCB);
});



