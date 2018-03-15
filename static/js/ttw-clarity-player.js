//variables that are shared across instances of the plugin
var ClarityDependenciesLoaded = ClarityDependenciesLoaded || false;
var ClarityTemplates = ClarityTemplates || false;

//todo:event handlers seem randomly scattered.
(function ($) {

    var ClarityPlayer = function ($anchor, myPlaylist, userOptions) {
        //Boulevard globals
        var $self = $anchor, isStarted = false, evtMgr, id, defaultOptions, options, cssSelector, playlist,
            albumCoverManager, backgroundManager, trackListManager, trackInfoManager, playlistInfo, templates, layout,
            current, isAnimating, isMini, isMiniHeight, numVisibleAlbumCovers, layoutParams, $playerLayoutOuter,
            $playerLayout, dependencies, layoutName, switchingLayout, listOfLayouts, currentLayoutIndex,
            optionsAtStartup, $loading;

        //Boulevard Entities
        var EventManager, Layout, AlbumCoverManager, AlbumCover, LayoutManager, PlaylistInfo, TrackListManager, TrackInfoManager,
            PlaylistManager, BackgroundManager, DependencyLoader, TemplateManager;

        cssSelector = {
            jPlayer:"#jquery_jplayer",
            jPlayerInterface:'.jp-interface',
            playerPrevious:".jp-previous",
            playerNext:".jp-next",
            volume:'.volume',
            trackList:'.track-list',
            tracks:'.tracks',
            track:'.track',
            trackInfo:'.track-info',
            trackTitle:'.track-title',
            trackArtist:'.track-artist',
            trackNumber:'.track-number',
            playerTitle:'.player-track-info',
            duration:'.duration',
            buy:'.buy',
            buyNotActive:'.not-active',
            playing:'.playing',
            moreButton:'.more',
            player:'.player',
            artist:'.artist',
            artistOuter:'.artist-outer',
            albumCover:'.album-cover',
            albumCoverImage:'.image',
            description:'.description',
            descriptionShowing:'.showing',
            albumCoverNaviation:'.album-covers-wrapper',
            playerLayoutOuter:'.player-layout-outer',
            playerLayout:'.player-layout',
            playerLayoutInner:'.player-layout-inner',
            playerControls:'.player-controls',
            playerBackgroundOuter:'.player-background-outer'
        };

        defaultOptions = {
            autoPlay:true,
            overlayOpacity:'.6',
            overlayColor:'dominant',
            gradientType:'vertical',
            gradientDegrees:'80deg',
            styleType:'blur',
            layout:'album-covers',
            smallScreenLayout:'single-album-cover',
            layoutType:false,
            jPlayer:{},
            autoLoadDependencies:true,
            backgroundImageSource:'cover',
            pluginPath:false,
            smallScreenSize:640,
            imageEffects:false,
            groupAlbumCoversInMiddle:true,
            additionalLayoutConfigs:[{layout:'album-cover-and-list'},{layout:'list'}],
            autoStart:true,
            baseLayout:false
        };



        $.fn.onThrottled = function (eventName, interval, handler) {
            var eventQueued = false;

            this.on(eventName, function () {
                if (!eventQueued) {
                    setTimeout(function () {
                        handler();
                        eventQueued = false;
                    }, interval);
                    eventQueued = true;
                }
            });
        };

        //event management
        EventManager = function () {
            var $evtTarget = $('<b/>');

            function on(event, callback) {
                //todo:need to convert on to this type of model
                $evtTarget.on(event, callback);
            }

            function once(event, callback) {
                //todo:this hasn't been tested at all
                var once = function () {
                    $evtTarget.off(event, once);
                    //get the arguments passed into this function, remove the event (e), and pass the arguments into the
                    //callback
                    callback.apply(this, Array.prototype.slice.call(arguments, 1));
                };
                $evtTarget.on(event, once);
            }

            function publish(event) {
                $evtTarget.trigger(event, Array.prototype.slice.call(arguments, 1));
            }

            function off(event, fn) {
                $evtTarget.off(event, fn);
            }

            return{
                on:on,
                once:once,
                off:off,
                publish:publish
            }
        };

        evtMgr = new EventManager();

        //playlist helper functions - artist, duration, etc
        PlaylistInfo = function () {
            function artist(index) {
                return !isUndefined(myPlaylist[index].artist) ? myPlaylist[index].artist : '-';
            }

            function duration(index) {
                return !isUndefined(myPlaylist[index].duration) ? myPlaylist[index].duration : '-';
            }

            function trackName(index) {
                if (!isUndefined(myPlaylist[index].title))
                    return myPlaylist[index].title;
                else if (!isUndefined(myPlaylist[index].mp3))
                    return fileName(myPlaylist[index].mp3);
                else if (!isUndefined(myPlaylist[index].oga))
                    return fileName(myPlaylist[index].oga);
                else return '';
            }

            return {
                trackName:trackName,
                artist:artist,
                duration:duration
            }
        };

        //manage playlist
        PlaylistManager = function () {

            var playing = false,
                $myJplayer = {};

            function init(playlistOptions) {
                var $playerInterface = $self.find(cssSelector.player),
                    cssSelectorAncestor = 'jp-interface-' + id;

                $playerInterface.addClass(cssSelectorAncestor);

                $myJplayer = $self.find('.jPlayer-container');

                var jPlayerDefaults, jPlayerOptions, volumeLevel = 3;

                jPlayerDefaults = {
                    swfPath:options.pluginPath + "dependencies/jquery-jplayer",
                    supplied:"mp3",
                    cssSelectorAncestor:'.' + cssSelectorAncestor,
                    errorAlerts:false,
                    warningAlerts:false
                };

                //apply any user defined jPlayer options
                jPlayerOptions = $.extend(true, {}, jPlayerDefaults, playlistOptions);

                $myJplayer.bind($.jPlayer.event.ready, function () {

                    //Bind jPlayer events. Do not want to pass in options object to prevent them from being overridden by the user
                    $myJplayer.bind($.jPlayer.event.ended, function () {
                        playlistNext();
                    });

                    $myJplayer.bind($.jPlayer.event.play, function () {
                        $myJplayer.jPlayer("pauseOthers");
                    });

                    $myJplayer.bind($.jPlayer.event.playing, function () {
                        playing = true;
                    });

                    $myJplayer.bind($.jPlayer.event.pause, function () {
                        playing = false;
                    });

                    //Bind next/prev click events
                    $self.find(cssSelector.playerPrevious).on('click', function () {

                        playlistPrev();
                        $(this).blur();
                        return false;
                    });

                    $self.find(cssSelector.playerNext).on('click', function () {
                        playlistNext();
                        $(this).blur();
                        return false;
                    });

                    $self.find(cssSelector.volume).on('click', function () {
                        var volumes = [0, 33, 66, 100],
                            volumeClasses = ['mute', 'low', 'medium', 'high'];

                        volumeLevel++;

                        if (volumeLevel > volumes.length - 1)
                            volumeLevel = 0;

                        $myJplayer.jPlayer("volume", volumes[volumeLevel] / 100);
                        $(this).attr('data-level', volumeClasses[volumeLevel]);

                    });

                    evtMgr.on('initPlaylistAdvance', function (e, index) {

                        if (index != current) {
                            playlistAdvance(index);
                        }
                        else {
                            if (!$myJplayer.data('jPlayer').status.srcSet) {
                                playlistAdvance(0);
                            }
                            else {
                                //todo: i don't like that clicking this will pause a track
                                togglePlay();
                            }
                        }
                    });

                    playlistInit(options.autoplay);
                });

                //Initialize jPlayer
                $myJplayer.jPlayer(jPlayerOptions);
            }

            function playlistInit(autoplay) {
                current = 0;

                if (autoplay) {
                    playlistAdvance(current, null, false);
                }
                else {
                    playlistConfig(current);

                    evtMgr.publish('playlistInit');
                }
            }

            function setPlaylist(newPlaylist) {
                current = 0;
                myPlaylist = newPlaylist;
                playlistConfig(current);

                //todo:loose coupling
                layout.setTitle();

            }


            function playlistConfig(index) {
                if (!canPlay())
                    return;

                current = index;

                $myJplayer.jPlayer("setMedia", myPlaylist[current]);
            }

            function playlistAdvance(index, direction, publishable) {
                if (!canPlay())
                    return;

                if (!direction) {
                    //the direction property tells the album cover manager which way to animate the covers. If we're
                    //currently playing the last element in the playlist and we click the right album cover (which
                    // represents the first track in the playlist), then the album covers need to animate to
                    // the 'next' item. If we're currently listening to the first track and the left album cover is
                    // (which represents the last item in the playlist, then we need to animate to the 'prev' item
                    if (current == getLastIndex() && index == 0)
                        direction = 'next';
                    else if (current == 0 && index == getLastIndex())
                        direction = 'prev';
                    else direction = index > current ? 'next' : 'prev';
                }

                playlistConfig(index);

                //we need this for the case of autoplay. Otherwise autoplay would trigger playlistInit and playlistAdvance
                //and this causes all of the 'playlistAdvance' functionality for AlbumCoverManager to run before it should
                if (publishable !== false)
                    evtMgr.publish('playlistAdvance', direction);

                play();
            }

            function playlistNext() {
                if (!canPlay())
                    return;

                var index = getNextIndex();
                playlistAdvance(index, 'next');
            }

            function canPlay() {
                return isAnimating === false;
            }

            function playlistPrev() {
                var index = getPrevIndex();
                playlistAdvance(index, 'prev');
            }

            function getNextIndex() {
                return (current + 1 < myPlaylist.length) ? current + 1 : 0;
            }

            function getPrevIndex() {
                return (current - 1 >= 0) ? current - 1 : getIndexOfLastItem();
            }

            function getLastIndex() {
                return myPlaylist.length - 1;
            }

            function getIndexOfLastItem() {
                return myPlaylist.length - 1;
            }

            function togglePlay() {
                if (!playing) {
                    play();
                }
                else $myJplayer.jPlayer("pause");
            }

            function play() {
                $myJplayer.jPlayer("play");
            }

            function pause() {
                $myJplayer.jPlayer('pause');
            }

            function destroy() {
                $myJplayer.jPlayer('destroy');
            }

            return{
                init:init,

                playlistInit:playlistInit,
                setPlaylist:setPlaylist,
                playlistAdvance:playlistAdvance,
                playlistNext:playlistNext,
                playlistPrev:playlistPrev,
                play:play,
                pause:pause,
                getNextIndex:getNextIndex,
                getPrevIndex:getPrevIndex,
                togglePlay:togglePlay,
                getIndexOfLastItem:getIndexOfLastItem,
                $myJplayer:$myJplayer,
                destroy:destroy
            };

        };

        //manage backgrounds
        BackgroundManager = function () {
            //todo:reduce the number of elements being animated, thereby reducing the number of deferreds and hopefully the overall complexity. This is mostly related to switching layouts smoothly.
            var currentCanvas = {}, $previousCanvas, backgroundUrl, $background, $previousBackground, imageColors,
                currentImage, styleType, hasColorClass = false, $backgroundContainer = $(cssSelector.playerBackgroundOuter);

            function createCanvas() {

                if (currentCanvas.$canvas)
                    $previousCanvas = currentCanvas.$canvas;
                else $previousCanvas = false;

                currentCanvas.$canvas = templates.$get('canvas');
                currentCanvas.$canvas.css('opacity', 0);
                currentCanvas.canvas = currentCanvas.$canvas.get(0);
                currentCanvas.context = currentCanvas.canvas.getContext('2d');
                currentCanvas.id = uniqueId();
                currentCanvas.$canvas.attr('id', currentCanvas.id);
            }

            function fadeOutOldCanvas() {
                if ($previousCanvas) {
                    $previousCanvas.animate({opacity:0}, function () {
                        currentCanvas.$canvas.siblings('canvas').remove();
                    });
                }
            }

            function addNewCanvas() {
                //if the previous canvas exists AND it's in the dom, we will add the new canvas before it
                if ($previousCanvas && jQuery.contains($playerLayout[0])) {
                    $backgroundContainer.find('canvas.player-background').before(currentCanvas.$canvas);
//                    //todo: I should seriously consider just having a background container that this is added to
                }
                else {
                    $backgroundContainer.append(currentCanvas.$canvas);
                }
            }

            function adjustBG(img, scale) {
                var imageScale = scale || 1,
                    maxTargetWidth = $backgroundContainer.width() * imageScale,
                    maxTargetHeight = $backgroundContainer.height() * imageScale,
                    imgRatio = img.width / img.height;

                var bgWidth = maxTargetWidth,
                    bgHeight = bgWidth / imgRatio;

                if (bgHeight < maxTargetHeight) {
                    bgHeight = maxTargetHeight;
                    bgWidth = bgHeight * imgRatio;
                }

                return {width:bgWidth, height:bgHeight};
            }

            function setupCanvas(imageObj) {
                var height = imageObj.height,
                    width = imageObj.width;

                //we set the canvas to the actual size of the image to prevent any scaling before we draw the image
                currentCanvas.canvas.width = width;
                currentCanvas.canvas.height = height;
            }

            function drawImage() {
                currentCanvas.context.drawImage(currentImage, 0, 0);
            }

            function positionCanvas(imageObj) {
                var scale = (options.styleType != 'blur' && options.styleType != 'blur-player') ? 1 : 2,
                    dimensions = adjustBG(imageObj, scale);
                //scaling the canvas via css because it's faster than all of the alternatives i tried (i.e.
                //scaling the image with the canvas drawImage functionality THEN blurring.)

                currentCanvas.$canvas.width(dimensions.width).height(dimensions.height);

                //center the image
                currentCanvas.$canvas.css({
                    left:-(dimensions.width - $backgroundContainer.width()) / 2,
                    top:-(dimensions.height - $backgroundContainer.height()) / 2
                });
            }

            function loadImage() {
                var loading = $.Deferred(),
                    imageObj = new Image();

                imageObj.onload = function () {
                    loading.resolve();
                };

                setBackgroundUrl();

                imageObj.src = backgroundUrl;

                currentImage = imageObj;

                return loading;
            }

            function setBackgroundUrl() {
                if (options.backgroundImageSource == 'image' && typeof myPlaylist[current].background != 'undefined') {
                    backgroundUrl = myPlaylist[current].background;
                }
                else if (myPlaylist[current].cover)
                    backgroundUrl = myPlaylist[current].cover;
                else backgroundUrl = false;
            }

            function getDominantColorFromImage(img) {
                var colorFound = $.Deferred();

                RGBaster.colors(img, function (colors) {
                    imageColors = colors;
                    colorFound.resolve(colors);
                }, 20);

                return colorFound;
            }

            function isLightOrDarkColor(color) {
                //pulled from jquery adaptive background

                var rgb = color.match(/\d+/g),
                // Helper function to calculate yiq - http://en.wikipedia.org/wiki/YIQ
                    yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;

                return yiq <= 128 ? 'dark-bg' : 'light-bg';
            }

            function processDominantColor() {
                var processingDominantColor = $.Deferred(), img;

                img = $('<img class="temp-image-for-dominant-color-extraction" src=' + backgroundUrl + ' />').get(0);

                $.when(getDominantColorFromImage(img)).done(function () {
                    manageColorClasses();

                    processingDominantColor.resolve();
                });

                return processingDominantColor;
            }

            function manageColorClasses() {
                var lightOrDarkClass = isLightOrDarkColor(imageColors.dominant);

                //the primary color class, which controls the color of the controls, only needs to be added for certain
                //style types
                if (styleType == 'overlay' || styleType == 'overlay-simple' || styleType == 'dominant-color')
                    addColorClassToPlayerLayout(lightOrDarkClass);
                else if (hasColorClass === true)
                    removeColorClassFromPlayer();

                //the secondary color class is added for all style types and can be used for optional css styling
                //regardless of style type
                addSecondaryColorClassToPlayerLayout(lightOrDarkClass);

                evtMgr.publish('colorsProcessed', imageColors, lightOrDarkClass);
            }

            function addSecondaryColorClassToPlayerLayout(lightOrDarkClass) {
                setAttribute('data-secondary-color', lightOrDarkClass);
            }

            function addColorClassToPlayerLayout(lightOrDarkClass) {
                hasColorClass = true;
                setAttribute('data-color', lightOrDarkClass);
            }

            function removeColorClassFromPlayer() {
                hasColorClass = false;
                setAttribute('data-color', '');
            }

            function createBackground(templateName) {
                $background = templates.$get(templateName);
            }


            function setPlayerControlsColor(playerControlsColor) {
                $playerLayout.find(cssSelector.playerControls).css('background', playerControlsColor);
            }

            function clearPlayerControlsColor() {
                $playerLayout.find(cssSelector.playerControls).css('background', '');
            }

            function setBackgroundColor(color) {
                $background.css('background', color);
            }

            function displayBackground() {
                var processing = $.Deferred();


                $background.css('opacity', 0);

                $backgroundContainer.append($background);

                if (!hasPreviousBackground()) {
                    $background.css('opacity', 1);
                    processing.resolve();
                }

                $background.animate({opacity:1}, function () {
                    $background.trigger('click');
                    removePreviousBackground();
                    processing.resolve();
                });

                return processing;
            }

            function hasPreviousBackground() {
                return $previousBackground && $previousBackground.length;
            }

            function removePreviousBackground() {
                if (hasPreviousBackground()) {

                    $previousBackground.remove();//$self.find('.player-background').remove();
                }
            }


            function rgbStringToArray(rgbString) {
                return  rgbString.replace(/[^\d,]/g, '').split(',');
            }


            function manageGeneralBackground() {

                if (!$background) {
                    createBackground('general-background');
                    return displayBackground();
                }
                else return false;

            }

            function setImageBackground(autoFadeOutOldCanvas) {
                var settingImage = $.Deferred();

                createCanvas();

                setupCanvas(currentImage);

                addNewCanvas();

                $.when(addImageEffects()).done(function () {

                    positionCanvas(currentImage);

                    showCanvas();

                    if (autoFadeOutOldCanvas !== false)
                        fadeOutOldCanvas();

                    settingImage.resolve();
                });

                return settingImage;
            }

            function showCanvas() {
                currentCanvas.$canvas.animate({opacity:1});
            }


            function addImageEffects() {
                var preProcessing, processing = $.Deferred();

                //there aren't currently any preprossing needs, but this could be useful in the future. It was useful
                //when there was going to be a colorize styletype that required dominant color processing before applying
                //image effects. If it becomes useful again in the future, preProcessing should be set to the deferred
                //returned by the the preprocessing function. ie. preProcessing = processDominantColor(), where the
                //function processDominantColor returns a deferred.
                preProcessing = true;

                $.when(preProcessing).done(function () {
                    $.when(applyImageEffects()).done(function () {
                        processing.resolve();
                    });
                });

                return processing;
            }

            function applyImageEffects() {
                var effects, processing = $.Deferred();

                if (styleType == 'blur' || styleType == 'blur-player') {
                    options.imageEffects = 'stackBlur[20]';
                }

                if (options.imageEffects === false || options.imageEffects === '') {

                    //if there are no effects to apply, let's add the image to the canvas now. When there are effects
                    //Caman will handle adding the image to the canvas. If we attempt to add the image manually, and
                    //then run Caman, the canvas will not show up on mobile (ugh)
                    drawImage();

                    processing.resolve();
                    return processing;
                }

                effects = options.imageEffects.split('|');

                //run the effect on the image, but make sure it's in the dom
                if (jQuery.contains($self[0], currentCanvas.$canvas[0])) {

                    var c = Caman(currentCanvas.$canvas[0], backgroundUrl, function () {

                        Caman.Event.listen(c, 'processComplete', function (job) {

                            //because the renderFinished event doesn't seem to fire when we're listening to a specific
                            // Caman instance so we need to figure this out ourselves
                            if (this.renderer.renderQueue.length == 0) {
                                processing.resolve();
                            }
                        });

                        $.each(effects, function (i, effect) {
                            var effectName, params, match = effect.match(/(.*?)\[(.*?)\]/);

                            if (match) {
                                effectName = match[1];
                                params = match[2].split(',');
                            }
                            else {
                                effectName = effect;
                                params = [];
                            }

                            if (c[effectName]) {
                                c[effectName].apply(c, params);
                            }

                            c.render();

                            //Caman doesn't seem to fire the processComplete event on stackBlur. A quick look at the
                            //Caman source seems to indicate that this might be because stackBlur is a plugin rather
                            //than a proper filter. No time to debug Caman source so let's just manually resolve the
                            //deferred for stackBlur
                            if (effectName == 'stackBlur' && effects.length == 1) {
                                processing.resolve();
                            }
                        });
                    });
                }

                return processing;
            }


            function clearBackground() {
                $background = null;
                //todo: need to reconcile this with remove previous background
                $playerLayout.find('.player-background').remove();
            }


            function applyBackground() {
                var applyingBackground = setImageBackground();


                return applyingBackground;
            }

            function setBackground() {

                var settingBackground = $.Deferred();

                styleType = options.styleType;

                setAttribute('data-style-type', styleType);

                $previousBackground = $self.find('.player-background');

                evtMgr.publish('settingBackground', styleType);

                //some backgrounds affect the color of the controls as well (i.e. setting background-color). We need
                //to undo that change
                clearPlayerControlsColor();

                $.when(loadImage()).then(processDominantColor).then(applyBackground).done(function () {
                    settingBackground.resolve();
                    evtMgr.publish('backgroundSet');
                });

                return settingBackground;
            }

            function resetBackground() {
                //clearBackground();
                $background = null;


                var $previousBackgrounds = $playerLayout.find('.player-background');
                $previousBackgrounds.removeClass('player-background').addClass('old-player-background').css('z-index', 1);
                $.when(setBackground()).done(function () {

                    $previousBackgrounds.animate({opacity:0}, function () {
                        $previousBackgrounds.remove();
                    });
                });
            }

            return{
                setBackground:setBackground,
                resetBackground:resetBackground
            }
        };


        //dependencies
        DependencyLoader = function () {

            function init() {
                if (typeof yepnope == 'undefined') {
                    error('YepNope is not defined. You must include YepNope in your page for the plugin to work.')
                }
            }

            function load(path) {
                var load, dependencies, loadComplete = $.Deferred();

                if (!options.autoLoadDependencies || ClarityDependenciesLoaded === true) {
                    loadComplete.resolve();
                    return loadComplete;
                }

                dependencies = {
                    rgbraster:['dependencies/rgbraster.js'],
                    jplayer:['dependencies/jquery-jplayer/jquery.jplayer.min.js'],
                    nanoscroller:['dependencies/nanoScrollerJS/jquery.nanoscroller.min.js', 'dependencies/nanoScrollerJS/nanoscroller.css'],
                    camanjs:['dependencies/CamanJS/caman.full.min.js']
                };

                if (path) {
                    var realPaths = {};
                    $.each(dependencies, function (key, dependency) {
                        var files = [];
                        $.each(dependency, function (i, file) {
                            files.push(path + file);
                        });
                        realPaths[key] = files;
                    });
                    dependencies = realPaths;
                }

                //create an array of all files that need to be loaded
                load = [];
                $.each(dependencies, function (dependency, fileList) {
                    load = load.concat(fileList);
                });

                yepnope({
                    load:load,
                    complete:function () {
                        ClarityDependenciesLoaded = true;
                        loadComplete.resolve();

                    }
                });

                return loadComplete;
            }

            init();

            return {
                load:load
            }
        };

        //templates
        TemplateManager = function () {
            var $templates;

            this.load = function (path) {
                var gettingTemplates;

                if (ClarityTemplates !== false) {
                    $templates = ClarityTemplates;
                    return true;
                }

                gettingTemplates = $.ajax({
                    //todo:this needs to be a config parameter
                    url:path + 'templates.html',
                    success:function (response) {
                        $templates = $(response);
                        ClarityTemplates = $templates;
                    }
                });

                return gettingTemplates;
            };

            this.$get = function (templateName) {
                return $templates.filter('#' + templateName).children().clone();
            }
        };

        //layouts
        LayoutManager = function () {

            var $player, $title, $tracks, $anchor, layouts = {};

            function init() {
                buildInterface();

                initLayouts();

                ensureAnchorHasDimensionsGreaterThanZero();
            }

            function ensureAnchorHasDimensionsGreaterThanZero() {
                var height = $self.height(),
                    width = $self.width();

                if (height == 0 || width == 0) {
                    height = $self.parent().height() || 281;
                    width = $self.parent().width() || 500;

                    $self.css({
                        'min-height':height,
                        'min-width':width
                    });
                }
            }

            function defineLayout(name, properties) {
                var newLayout = new Layout();
                newLayout.name = name;

                if (properties.init) {
                    newLayout.init = function () {
                        //we want to call the prototype init function regardless of whether this layout has it's own init
                        Layout.prototype.init.apply(newLayout);
                        properties.init.apply(newLayout);
                        Layout.prototype.postInitProcessing.apply(newLayout);
                    };
                }

                if (properties.position) {
                    newLayout.position = function () {
                        properties.position.apply(newLayout);
                    };
                }

                layouts[name] = newLayout;
            }

            function initLayouts() {
                defineLayout('album-cover-and-list', {
                    init:function () {
                        var self = this;

                        //Layout.prototype.init();

                        albumCoverManager.setAlbumCoverLayout('single');

                        trackListManager.buildTrackList();
                    },
                    position:function () {
                        //55 is the height of the track info under the album cover
                        //var margin = (this.$inner.height() - this.$albumCover.height() + this.$controls.height() - 55) * .8;
                        var margin = this.$inner.height() - albumCoverManager.getAlbumCoverSize() - 75;

                        this.$albumCover.css('margin-top', margin);
                        this.$trackList.css('margin-top', margin);
                    }
                });


                defineLayout('single-album-cover', {
                    init:function () {
                        albumCoverManager.setAlbumCoverLayout('single');
                    },
                    position:function () {
                        var margin = this.$inner.height() - albumCoverManager.getAlbumCoverSize() - 120;

                        if (margin < 0)
                            margin = 0;

                        this.$albumCover.css('margin-top', margin);
                    }
                });

                defineLayout('album-covers', {
                    init:function () {
                        albumCoverManager.setAlbumCoverLayout();
                    },
                    position:function () {
                        var margin = this.$inner.height() - albumCoverManager.getAlbumCoverSize() - 120;

                        if (margin < 0)
                            margin = 0;

                        this.$albumCover.css('margin-top', margin);
                    }
                });


                defineLayout('list', {
                    init:function () {
                        var self = this;

                        trackListManager.buildTrackList();
                    }
                });

                defineLayout('blank', {});
            }

            function setLayout(newLayout) {
                var destroying = false,
                    settingLayout = $.Deferred(),
                    newLayoutName = newLayout || options.layout;

                evtMgr.publish('settingLayout', newLayoutName);

                if (layoutName)
                    destroying = layouts[layoutName].destroy();

                $.when(destroying).done(function () {
                    layoutName = newLayoutName;

                    if (!layouts[newLayoutName]) {
                        error(newLayoutName + ' is not a valid layout name');
                        return false;
                    }

                    setAttribute('data-layout', newLayoutName);

                    replaceLayout();

                    $playerLayout = $self.find(cssSelector.playerLayout);

                    setLayoutParams();

                    layouts[newLayoutName].init();

                    settingLayout.resolve();
                    evtMgr.publish('layoutSet');

                });

                return settingLayout;

            }

            function getCurrentLayout() {
                return layouts[layoutName];
            }

            function initDomElements() {

                //$player = $self.find(cssSelector.player);
                $title = $self.find(cssSelector.playerTitle); //todo: is this used?
                //$anchor = $self.find(cssSelector.albumCoverNaviation);
            }

            function buildInterface(layoutName) {
                var $interface;

                layoutName = layoutName || options.layout;

                if (!options.baseLayout)
                    $interface = templates.$get('base-layout');
                else $interface = options.baseLayout instanceof jQuery ? options.baseLayout.clone() : $(options.baseLayout);

                if (!$interface.length)
                    error('Invalid layout name');

                $interface.css({opacity:0}).appendTo($self);

                $player = templates.$get('player-interface');

                //todo:css selector
                $self.find('.player-controls-outer').append($player);

                initDomElements();

                $interface.animate({opacity:1});
            }

            function setManualLayoutType() {
                if (options.layoutType) {
                    var layoutTypes = options.layoutType.split(' ');
                    $.each(layoutTypes, function (i, type) {
                        $self.addClass('forced-' + type);

                        if (type == 'mini' || type == 'mini2')
                            setMiniLayout(type);
                        else if (type == 'mini-height')
                            setMiniHeightLayout();
                    });
                }
            }


            function manageLayout(force) {
                var width = $self.width();

                if (width <= options.smallScreenSize && (layoutName != options.smallScreenLayout || force === true)) {
                    setLayout(options.smallScreenLayout);
                }
                else if (width > options.smallScreenSize && (layoutName != options.layout || force === true))
                    setLayout(options.layout);

                managePlayerControlsStyle();

            }

            function replaceLayout() {
                //todo:should the build interface function use this?
                //todo:should this go on the layout object
                var $newLayout = templates.$get(layoutName);

                if (!$newLayout.length)
                    error('No template for this layout - ' + layoutName);

                //todo:Layout.addTo($anchor);
                $self.find('.player-layout').prepend($newLayout.find('.player-layout-inner'));
            }

            function setTitle() {
                var title, artist = playlistInfo.artist(current);

                if (artist)
                    title = playlistInfo.trackName(current) + ' - ' + artist;
                else title = playlistInfo.trackName(current);

                $title.html(title);
            }

            function resize() {
                manageLayout();

            }

            function managePlayerControlsStyle() {
                var isMiniScreenSize = $self.width() <= options.smallScreenSize,
                    miniCheckNotPerformedYet = typeof isMini == 'undefined',
                    isMiniHeightScreenSize = $self.height() <= 500,
                    miniHeightCheckNotPerformedYet = typeof isMiniHeight == 'undefined';

                if (options.layoutType) {
                    setManualLayoutType();
                    return;
                }

                //WIDTH: determine whether or not to show the mini layout
                if (isMiniScreenSize && (!isMini || miniCheckNotPerformedYet)) {
                    setMiniLayout();

                }
                else if (!isMiniScreenSize && (isMini || miniCheckNotPerformedYet)) {
                    removeMiniLayout();
                }

                //HEIGHT: determine whether or not to show the mini layout
                //todo: make dry. This the same code as above
                if (isMiniHeightScreenSize && (!isMiniHeight || miniHeightCheckNotPerformedYet)) {
                    setMiniHeightLayout();
                }
                else if (!isMiniHeightScreenSize && (isMiniHeight || miniHeightCheckNotPerformedYet)) {
                    removeMiniHeightLayout();
                }
            }

            function setMiniLayout(miniClass) {
                miniClass = miniClass || 'mini';

                isMini = true;
                $self.addClass(miniClass);
            }

            function removeMiniLayout() {
                isMini = false;
                $self.removeClass('mini mini2');
            }

            function setMiniHeightLayout() {
                isMiniHeight = true;
                $self.addClass('mini-height');
            }

            function removeMiniHeightLayout() {
                isMiniHeight = false;
                $self.removeClass('mini-height');
            }


            function setLayoutParams() {

                layoutParams = {
                    playerWidth:$self.width(),
                    playerHeight:$player.height(),
                    playerTopMargin:parseInt($self.find(cssSelector.playerLayoutInner).css('padding-top'), 10)
                }
            }

            function handlePlaylistAdvance() {
            }

            function handleResize() {
            }

            return{
                setLayoutParams:setLayoutParams,
                buildInterface:buildInterface,
                setTitle:setTitle,
                managePlayerControlsStyle:managePlayerControlsStyle,
                resize:resize,
                getCurrentLayout:getCurrentLayout,
                setLayout:setLayout,
                manageLayout:manageLayout,
                init:init
            }
        };

        //individual layout
        Layout = function () {
            //todo: does there need to be a playlist advance function?
            //are unjused components still running?
            this.id = uniqueId();
            this.name = '';
            this.domElementsWithEventHandlers = [];
        };

        Layout.prototype.domElements = {
            $inner:'.player-layout-inner',
            $albumCover:'.album-covers-wrapper',
            $trackList:'.track-list-wrapper',
            $trackInfo:'.track-info-wrapper',
            $controls:'.player-controls'
        };

        Layout.prototype.init = function () {
            this.initDomElements();
        };

        Layout.prototype.postInitProcessing = function () {
            var self = this;

            this.position();

            this.bind($(window), 'resize', function () {
                self.position();
            });
        };

        Layout.prototype.position = function () {
        };

        Layout.prototype.initDomElements = function () {
            var self = this;

            $.each(this.domElements, function (elName, selector) {
                self[elName] = $self.find(selector);
            });
        };

        Layout.prototype.bind = function (elementOrEvent, eventOrHandler, handler) {
            var $element, event;

            if (handler) {
                $element = elementOrEvent;
                event = eventOrHandler;
            }
            else {
                $element = $self;
                event = elementOrEvent;
                handler = eventOrHandler;
            }

            $element.on(event + '.' + this.name, handler);
            this.addEvent($element);
        };

        Layout.prototype.addEvent = function ($element) {
            this.domElementsWithEventHandlers.push($element);
        };

        Layout.prototype.destroy = function () {
            var self = this,
                destroying = $.Deferred();

            $.each(this.domElementsWithEventHandlers, function (i, $element) {
                $element.off('.' + self.name);
            });

            this.domElementsWithEventHandlers = [];

            $self.find('.player-layout-inner').animate({opacity:0}, function () {
                $self.find('.player-layout-inner').off().empty().remove();
                destroying.resolve();
            });

            return destroying;
        };

        //track list widget
        TrackListManager = function () {
            var $tracks, $tracksWrapper;

            function buildTrackList() {
                //todo:this should definitely be on the
                $tracksWrapper = $self.find(cssSelector.tracks);

                for (var j = 0; j < myPlaylist.length; j++) {
                    var $track = templates.$get('list-item');

                    $track.find(cssSelector.trackNumber).html(j + 1);
                    $track.find(cssSelector.trackTitle).html(playlistInfo.trackName(j));
                    $track.find(cssSelector.trackArtist).html(playlistInfo.artist(j));
                    $track.find(cssSelector.duration).html(playlistInfo.duration(j));

                    $track.data('index', j);
                    $track.attr('data-index', j);

                    $tracksWrapper.append($track);
                }

                $tracks = $tracksWrapper.find(cssSelector.track);

                //todo: wtf is this doing here?
                //todo: is this ued for the list view
                $tracks.on('click', function () {
                    evtMgr.publish('initPlaylistAdvance', $(this).data('index'));
                    $tracks.eq(current).addClass(attr(cssSelector.playing)).siblings().removeClass(attr(cssSelector.playing));

                });

                setTrackListSize();
                bindEvents();
            }

            function setTrackListSize(basedOn) {
                var $tracklist = $self.find(cssSelector.trackList),
                    wrapperHeight, height;
                //todo:there has to be a better way to get this information than from the dom

                if (albumCoverManager.hasAlbumCovers())
                    var size = albumCoverManager.getAlbumCoverSize();
                else size = '100%';

                height = size;

                //we don't want the height of the tracklist to be more than it's container
                wrapperHeight = $tracksWrapper.height();

                if (height > wrapperHeight && wrapperHeight > 0)
                    height = wrapperHeight;


                $tracklist.height(height).width(size);
                $tracklist.nanoScroller();
            }

            function bindEvents() {
                //todo:global bind function
                $(window).on('resize.' + id, function () {
                    setTrackListSize();
                });

                evtMgr.on('playlistAdvance playlistInit', function () {
                    setTrackListNowPlaying();
                });
            }

            function setTrackListNowPlaying() {
                if ($tracks)
                    $tracks.eq(current).addClass('playing').siblings('.playing').removeClass('playing');
            }

            return{
                buildTrackList:buildTrackList,
                setTrackListSize:setTrackListSize
            }
        };


        //album cover widget manager
        AlbumCoverManager = function () {
            this.initialized = false;
            this.animationDuration = 500;
            this.anchorWidth = null;
            this.albumCoverLayout = false;
            this.albumCoversByPosition = {};
            this.$anchor = false;
        };

        AlbumCoverManager.prototype.init = function (properties) {
            properties = properties || {};

            if (!properties.$anchor)
                this.$anchor = $self.find(cssSelector.albumCoverNaviation);
            else this.$anchor = properties.$anchor;

            //the default layout is the slider, which doesn't make sense if there is only one item.
            if (myPlaylist.length <= 1 && !this.albumCoverLayout)
                this.albumCoverLayout = 'single';

            this.manageAlbumCoverLayout();

            this.bindDomEvents();

            //the events handlers that are fired when playlist events fire only need to be bound once. I.e. on playlistAdvance,
            //but the dom events (i.e. clicks to ablum covers), need to be re-bound each time the album cover manager
            //init function is called (i.e when the layout changes from one album cover layout to another
            if (!this.initialized)
                this.bindPlayerEvents();

            this.initialized = true;
        };

        AlbumCoverManager.prototype.positionAndSizeAlbumCovers = function () {
            $.each(this.albumCoversByPosition, function (position, albumCover) {
                albumCover.setAlbumCoverSize();
                albumCover.setPosition(parseInt(position));
            });
        };

        AlbumCoverManager.prototype.changeCurrentlyPlaying = function (direction) {

            if (this.albumCoverLayout == 'single' || this.albumCoverLayout == 'single-fill-space') {
                this.setSingleAlbumCoverLayout();
            }
            else if (this.albumCoverLayout == 'wall') {

            }
            else this.moveAlbumCoversOnPlaylistAdvance(direction);
        };

        AlbumCoverManager.prototype.handleAlbumCoverClick = function ($cover) {
            if (this.albumCoverLayout == 'single')
                return;

            var albumCover = $cover.parent().data('cover');

//                var positionOfClickedCover = $cover.parent().attr('data-position'),
//                    albumCover = albumCoversByPosition[positionOfClickedCover];

            if (albumCover.position == 2)
                playlist.togglePlay();
            else playlist.playlistAdvance(albumCover.index);
        };

        AlbumCoverManager.prototype.verifyAlbumCoverForPrevSongSet = function () {
            if (typeof this.albumCoversByPosition[3] == 'undefined')
                this.addAlbumCover(playlist.getIndexOfLastItem(), 3);
        };

        AlbumCoverManager.prototype.addAlbumCover = function (index, endPosition, startPosition) {
            var addToPosition;

            //if there is both a start position and an end position then we are going to add hte album cover at
            //start position and animate it to endPosition. If there is just an endPosition then we add it with
            //no animation

            //we need to figure out where we're initially adding the album cover
            if (typeof startPosition != 'undefined')
                addToPosition = startPosition;
            else addToPosition = endPosition;

            var albumCover = new AlbumCover({
                animationDuration:this.animationDuration,
                $anchor:this.$anchor,
                index:index,
                position:addToPosition
            });

            //regardless of where the album cover is added, we always log it at the endPosition because that's
            //where it will end up.
            this.logAlbumCoverPosition(albumCover, endPosition);

            albumCover.render();

            //let's the actual animation if required
            if (typeof startPosition != 'undefined') {
                albumCover.setPosition(endPosition, true);
            }
        };

        AlbumCoverManager.prototype.logAlbumCoverPosition = function (albumCover, position) {
            this.albumCoversByPosition[position] = albumCover;
        };

        AlbumCoverManager.prototype.getAlbumCoverAtPosition = function (position) {
            return this.albumCoversByPosition[position];
        };

        AlbumCoverManager.prototype.clearAlbumCovers = function () {
            $.each(this.albumCoversByPosition, function (position, albumCover) {
                albumCover.remove();
            });

            this.albumCoversByPosition = {};
        };

        AlbumCoverManager.prototype.moveAlbumCoversOnPlaylistAdvance = function (direction) {
            var self = this, animations = [];

            //move the album covers
            if (direction == 'prev')
                this.verifyAlbumCoverForPrevSongSet();

            isAnimating = true;

            $.each(this.albumCoversByPosition, function (i, albumCover) {
                var positioning;

                if (direction == 'next') {
                    positioning = albumCover.increasePosition();
                }
                else if (direction == 'prev') {
                    positioning = albumCover.decreasePosition();
                }

                animations.push(positioning);

                //remove album covers that are off screen;
                $.when(positioning).done(function () {
                    if (albumCover.position > 3 || albumCover.position < 1) {
                        albumCover.remove();
                    }
                    else self.logAlbumCoverPosition(albumCover, albumCover.position);
                });
            });

            $.when.apply($, animations).done(function () {
                isAnimating = false;
            });

            //the album covers will be moving so we need to add a new one either at the end or the beginning
            var position, index, startPosition;

            if (direction == 'next') {
                position = 1;
                index = playlist.getNextIndex();
                startPosition = 0;
            }
            else if (direction == 'prev') {
                position = 3;
                index = playlist.getPrevIndex();
                startPosition = 4;
            }

            this.addAlbumCover(index, position, startPosition);
        };

        AlbumCoverManager.prototype.setSingleAlbumCoverLayout = function () {
            var albumCover;

            numVisibleAlbumCovers = 1;

            this.clearAlbumCovers();

            albumCover = new AlbumCover({
                position:2,
                $anchor:this.$anchor,
                index:current,
                type:this.albumCoverLayout
            });

            this.logAlbumCoverPosition(albumCover, 2);

            albumCover.render();
        };


        AlbumCoverManager.prototype.initLayout = function (animate) {
            var startPosition;

            numVisibleAlbumCovers = 3;

            if (animate !== false) {
                startPosition = 0;
            }
            else startPosition = false;

            this.clearAlbumCovers();
            this.addAlbumCover(current, 2, startPosition);
            this.addAlbumCover(playlist.getNextIndex(), 1, startPosition);
        };

        AlbumCoverManager.prototype.getAlbumCoverSize = function () {
            return this.albumCoversByPosition[2].size;
        };

        AlbumCoverManager.prototype.hasAlbumCovers = function () {
            return typeof this.albumCoversByPosition[2] != 'undefined';
        };

        AlbumCoverManager.prototype.setAlbumCoverLayout = function (layout, properties) {
            this.albumCoverLayout = layout;
            this.init(properties);
        };

        AlbumCoverManager.prototype.manageAlbumCoverLayout = function () {


            if (this.albumCoverLayout == 'single' || this.albumCoverLayout == 'single-fill-space') {
                this.setSingleAlbumCoverLayout();
            }
            else this.initLayout(false);
        };

        AlbumCoverManager.prototype.bindDomEvents = function () {
            var self = this;
            this.$anchor.on('click', '.album-cover', function () {
                self.handleAlbumCoverClick($(this));
            });
        };

        AlbumCoverManager.prototype.bindPlayerEvents = function () {
            var self = this;

            evtMgr.on('playlistAdvance', function (e, direction) {
                //todo:should this go in the layout? Or in the album cover manager?
                self.changeCurrentlyPlaying(direction);
            });

            evtMgr.on('settingLayout', function () {
                self.clearAlbumCovers();
            });

            //todo:this should only happen if this is active for the current layout
            //todo: need a plugin level bind function that automatically namespaces events so I don't have to do it manually. I will definitely forget and then there will be phantom event handlers mucking everything up
            $(window).on('resize.' + id, function () {
                self.positionAndSizeAlbumCovers();
            });
        };

        //album cover widget
        AlbumCover = function (properties) {
            this.$element = false;
            this.margin = 80;
            this.verticalMargin = 120;
            this.position = properties.position;
            this.$anchor = properties.$anchor;
            this.id = uniqueId();
            this.animationDuration = properties.animationDuration;
            this.index = properties.index;
            this.media = myPlaylist[this.index]; //properties.media;
            this.autoSetSize = typeof properties.setSize != 'undefined' ? properties.setSize : true;
            this.type = properties.type;

        };

        AlbumCover.prototype.build = function () {
            this.$element = templates.$get('album-cover');
            this.$albumCoverImage = this.$element.find(cssSelector.albumCoverImage);
        };

        AlbumCover.prototype.setInfo = function () {
            this.$element.find(cssSelector.trackTitle).html(this.media.title);
            this.$element.find(cssSelector.trackArtist).html(this.media.artist);
        };

        AlbumCover.prototype.remove = function () {

            this.$element.remove();
            $self.off('.' + this.id);
        };

        AlbumCover.prototype.calculatePosition = function (position) {
            if (options.groupAlbumCoversInMiddle == true)
                return this.calculatePositionGroupedInMiddle(position);
            else return this.calculatePositionUsingAllSpace(position);
        };

        AlbumCover.prototype.calculatePositionGroupedInMiddle = function (position) {
            var self = this,
                pixelPosition,
                basePosition = ((self.totalSize * (position - 1)) + self.margin / 2);

            //if the base position is less than 0, that means we want the album cover to animate from off screen). if
            //we add the offset, then it might not animate from off screen. So we only add the offset if the base
            //position is greater than or equal to 0.
            if (basePosition < 0)
                pixelPosition = basePosition;
            else pixelPosition = basePosition + this.offset;

            return  pixelPosition + 'px';
        };

        AlbumCover.prototype.calculatePositionUsingAllSpace = function (position) {
            var positions, width, position0, position1, position2, position3, position4, differenceBetweenCovers;

            //todo: these don't need to be calculated every time. Only when the screen size changes.
            width = layoutParams.playerWidth;

            position1 = this.margin;
            position2 = (width - this.size) / 2;
            position3 = width - this.margin - this.size;

            differenceBetweenCovers = position3 - position2;
            position0 = position1 - differenceBetweenCovers;
            position4 = position3 + differenceBetweenCovers;

            positions = [position0, position1, position2, position3, position4];

            return positions[position];
        };

        AlbumCover.prototype.setPosition = function (position, animate) {
            var self = this, animationProperties, animationOptions, positioningDeferred = new $.Deferred();

            this.position = position;

            this.$element.attr('data-position', position);

            if (numVisibleAlbumCovers == 1) {
                //todo:this needs to be renamed
                //this.setMiniPosition(position);
                positioningDeferred.resolve();
                return positioningDeferred;
            }

            this.$element.css({
                position:'absolute'
            });

            if (!animate) {
                this.$element.css({
                    right:self.calculatePosition(position)
                });

                positioningDeferred.resolve();
            }
            else {
                animationOptions = {
                    duration:this.animationDuration,
                    complete:function () {
                        positioningDeferred.resolve();
                    }
                };

                animationProperties = {
                    right:self.calculatePosition(position)
                };

                this.$element.stop().animate(animationProperties, animationOptions);
            }

            return positioningDeferred;
        };

        AlbumCover.prototype.setMiniPosition = function (position) {
            var self = this;

            this.$element.css({
                'margin-top':self.$anchor.height() - this.size - 75
            });

        };

        AlbumCover.prototype.increasePosition = function () {

            return this.setPosition(this.position + 1, true);
        };

        AlbumCover.prototype.decreasePosition = function () {
            return this.setPosition(this.position - 1, true);
        };

        AlbumCover.prototype.setSize = function (size) {
            this.size = size;
            this.totalSize = this.size + this.margin;
        };

        AlbumCover.prototype.setAlbumCoverSize = function () {
            var albumCoverSize;
            var windowWidth = this.$anchor.outerWidth();

            if (this.autoSetSize === false)
                return;

            if (this.type != 'single-fill-space')
                albumCoverSize = this.calculateSize(windowWidth);
            else albumCoverSize = this.calculateSizeToFillSpace();

            this.setSize(albumCoverSize);

            this.calculateOffset(windowWidth);

            this.$element.width(albumCoverSize).find(cssSelector.albumCover).height(albumCoverSize).width(albumCoverSize);

            if (this.type == 'single-fill-space')
                this.positionInCenter(albumCoverSize);

            return albumCoverSize;
        };

        AlbumCover.prototype.positionInCenter = function (size) {
            var width = this.$anchor.width(),
                height = this.$anchor.height();

            this.$element.css({
                left:(width - size) / 2,
                top:(height - size) / 2
            });
        };

        AlbumCover.prototype.calculateSize = function (windowWidth) {

            var albumCoverSize = $self.height() - layoutParams.playerHeight - layoutParams.playerTopMargin - this.verticalMargin;

            if ((albumCoverSize + this.margin) * numVisibleAlbumCovers > windowWidth) {
                albumCoverSize = (windowWidth / numVisibleAlbumCovers) - this.margin;
            }

            return  Math.floor(albumCoverSize);
        };

        AlbumCover.prototype.calculateSizeToFillSpace = function () {
            var maxTargetWidth = this.$anchor.width(),
                maxTargetHeight = this.$anchor.height();

            return (maxTargetWidth > maxTargetHeight) ? maxTargetWidth : maxTargetHeight;
        };

        AlbumCover.prototype.calculateOffset = function (windowWidth) {
            var offset = (windowWidth - this.totalSize * numVisibleAlbumCovers) / 2;

            if (offset < 0)
                offset = 0;

            this.offset = offset;
        };

        AlbumCover.prototype.render = function () {
            var self = this;

            this.build();

            this.setAlbumCoverSize();

            this.setInfo();

            if (typeof this.position != 'undefined')
                this.setPosition(this.position);

            //todo: do I really want to do this? Only needed for clicks on wall
            this.$element.data('cover', this);

            this.$element.appendTo(this.$anchor);

            return this.setCover(this.media);
        };

        AlbumCover.prototype.setCover = function (media) {
            var self = this,
                coverDeferred = $.Deferred();

            this.$albumCoverImage.animate({opacity:0}, 'fast', function () {
                if (!isUndefined(media.cover)) {

                    var now = current;
                    var imageObj = new Image();
                    var $image = $('<img  alt="album cover" />').css('opacity', 0);
                    self.$albumCoverImage.prepend($image);
                    $image.attr('src', media.cover);

                    imageObj.onload = function () {

                        if (now == current) {
                            $image.css('opacity', 1);
                            self.$albumCoverImage.animate({opacity:1});

                            //setCoverBackground();

                        }

                        coverDeferred.resolve();
                    };

                    imageObj.src = media.cover;

                }
            });

            return coverDeferred;
        };


        function getPluginPath() {
            // ATTENTION: fixes to this code must be ported to
            // var basePath in "core/loader.js".

            // Find out the editor directory path, based on its <script> tag.
            var path = window.CKEDITOR_BASEPATH || '';

            if ( !path ) {
                var scripts = document.getElementsByTagName( 'script' );

                for ( var i = 0; i < scripts.length; i++ ) {
                    var match = scripts[ i ].src.match( /(^|.*[\\\/])ttw-clarity-player(?:_basic)?(?:_source)?.js(?:\?.*)?$/i );

                    if ( match ) {
                        path = match[ 1 ];
                        break;
                    }
                }
            }

            // In IE (only) the script.src string is the raw value entered in the
            // HTML source. Other browsers return the full resolved URL instead.
            if ( path.indexOf( ':/' ) == -1 && path.slice( 0, 2 ) != '//' ) {
                // Absolute path.
                if ( path.indexOf( '/' ) === 0 )
                    path = location.href.match( /^.*?:\/\/[^\/]*/ )[ 0 ] + path;
                // Relative path.
                else
                    path = location.href.match( /^[^\?]*\/(?:)/ )[ 0 ] + path;
            }

            if ( !path )
                throw 'The CKEditor installation path could not be automatically detected. Please set the global variable "CKEDITOR_BASEPATH" before creating editor instances.';

            return path;
        }

        function showLoadingScreen() {
            $loading = $('<div class="blvd-loading"><div>Loading..(sc.chinaz.com)</div></div>').height($self.outerHeight());

            $self.append($loading);
        }

        function hideLoadingScreen() {
            $loading.animate({opacity:0}, function () {
                $loading.remove();
            });
        }

        function startApp() {
            //$Start App
            showLoadingScreen();

            $self.addClass('player-container'); //todo: css selector

            //options change change when we call setLayout. Each time we call it, we want to apply the layout related options
            //to the options at startup.
            optionsAtStartup = options;

            //todo: are these two things run for EVERY instance of the player?
            templates = new TemplateManager();
            dependencies = new DependencyLoader();

            if(!options.pluginPath)
                options.pluginPath = getPluginPath();

            $.when(dependencies.load(options.pluginPath), templates.load(options.pluginPath)).done(function () {

                layout = new LayoutManager();
                layout.init();

                $playerLayoutOuter = $self.find(cssSelector.playerLayoutOuter);

                playlist = new PlaylistManager();
                playlist.init(options.jPlayer);

                //todo: reevaluate auto initializing components. I should only create components required by the layout.
                albumCoverManager = new AlbumCoverManager();
                backgroundManager = new BackgroundManager();
                trackListManager = new TrackListManager();
                playlistInfo = new PlaylistInfo();

                initLayoutSwitching();

                //event handlers
                evtMgr.on('playlistInit', function () {
                    //albumCoverManager.init();
                    layout.manageLayout();
                });

                $(window).on('resize.' + id, function () {
                    layout.setLayoutParams();
                });

                //background
                evtMgr.on('playlistInit playlistAdvance', function () {
                    backgroundManager.setBackground();
                });

                //interface
                evtMgr.on('playlistAdvance playlistInit', function (e, direction) {
                    layout.setTitle();

                });

                $(window).onThrottled('resize.' + id, 500, function () {
                    backgroundManager.setBackground();

                    layout.resize();
                });

                $('.toggle-layout').on('click', function () {
                    if (listOfLayouts.length <= 1)
                        return;

                    currentLayoutIndex++;

                    if (currentLayoutIndex > listOfLayouts.length - 1)
                        currentLayoutIndex = 0;

                    switchLayoutAndBackground(listOfLayouts[currentLayoutIndex]);
                });


                hideLoadingScreen();

                isStarted = true;
                evtMgr.publish('started');

            });
        }

        function initLayoutSwitching() {
            var currentLayoutParams = $.extend(true, {}, options);

            listOfLayouts = options.additionalLayoutConfigs || [];

            listOfLayouts.push(currentLayoutParams);

            currentLayoutIndex = listOfLayouts.length - 1;
        }

        function switchLayoutAndBackground(params) {
            if (switchingLayout == true)
                return;

            showLoadingScreen();

            switchingLayout = true;

            options = $.extend(true, {}, optionsAtStartup, params);

            evtMgr.publish('layoutSwitching', options);

            $.when(layout.setLayout(options.layout)).then(backgroundManager.resetBackground).done(function () {
                switchingLayout = false;
                hideLoadingScreen();
                evtMgr.publish('layoutSwitchComplete');
            });
        }

        function setAttribute(name, value) {
            $playerLayoutOuter.attr(name, value);
        }

        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
        function isInteger(nVal) {
            return typeof nVal === "number" && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
        }

        //api functions
        function destroy() {
            //unbind events
            $self.off();
            //remove any children and unbind their events
            $self.empty();

            $(window).off('resize.' + id);

            playlist.destroy();
        }

        function setLayout(config) {
//undo

            if (isInteger(config) && options.additionalLayoutConfigs && options.additionalLayoutConfigs[config]) {
                currentLayoutIndex = config;
                config = options.additionalLayoutConfigs[currentLayoutIndex];
            }

            switchLayoutAndBackground(config);
        }

        function manageLayout() {
            layout.manageLayout(true);

            //if the layout is changing from regular to small screen, then the background will need to be resized
            backgroundManager.setBackground();
        }

        function redrawBackground() {
            backgroundManager.setBackground();
        }

        function start(config) {

            if (config)
                options = $.extend(true, {}, options, config);


            //todo: i should be able to pass in config parameters here... :)
            startApp();
        }

        function hasStarted() {
            return isStarted === true;
        }

        function off() {
            var args = Array.prototype.slice.call(arguments);
            evtMgr.off.apply(this, args);
        }

        function on() {
            var args = Array.prototype.slice.call(arguments);
            evtMgr.on.apply(this, args);
        }

        function once() {
            var args = Array.prototype.slice.call(arguments);
            evtMgr.once.apply(this, args);
        }

        function getOptions() {
            return options;
        }

        function redraw() {
            layout.manageLayout(true);
        }

        function play() {
            playlist.play();
        }

        function pause() {
            playlist.pause();
        }

        function next() {
            playlist.playlistNext();
        }

        function prev() {
            playlist.playlistPrev();
        }

        function togglePlay() {
            playlist.togglePlay();
        }

        function setOptions(newOptions) {
            options = $.extend(true, {}, options, newOptions);
            optionsAtStartup = $.extend(true, {}, optionsAtStartup, newOptions);
        }

        //todo:is this necessary?
        function swapPlaylist(newPlaylist) {
            myPlaylist = newPlaylist;
            playlist.playlistInit(true);

            //todo: the tile on the player interface isn't updated since playlistInit(true) doesnt publish the playlistInit event. Messy.
            layout.setTitle();
            redraw();
        }

        function setPlaylist(newPlaylist) {

            playlist.setPlaylist(newPlaylist);
        }

        //todo:get rid of this when we expose all of the widgets
        function getAlbumCoverManager() {
            return new AlbumCoverManager();
        }

        function getPlaylist() {
            return myPlaylist;
        }

        //utility functions
        function fileName(path) {
            path = path.split('/');
            return path[path.length - 1];
        }

        function uniqueId() {
            return new Date().getTime() + '-' + Math.floor(Math.random() * (100000 - 1 + 1)) + 1;
        }

        function attr(selector) {
            return selector.substr(1);
        }

        function isUndefined(value) {
            return typeof value == 'undefined';
        }

        function error(message) {
            console.log('ERROR: ' + message);
        }

        //start the plugin
        options = $.extend(true, {}, defaultOptions, userOptions);


        current = 0;

        isAnimating = false;

        switchingLayout = false;

        id = uniqueId();

        if (options.autoStart === true)
            startApp();


        //


        return {
            start:start,
            hasStarted:hasStarted,
            destroy:destroy,
            setLayout:setLayout,
            manageLayout:manageLayout,
            on:on,
            once:once,
            off:off,
            getOptions:getOptions,
            redraw:redraw,
            redrawBackground:redrawBackground,
            play:play,
            pause:pause,
            prev:prev,
            next:next,
            togglePlay:togglePlay,
            setOptions:setOptions,
            swapPlaylist:swapPlaylist,
            setPlaylist:setPlaylist,
            getAlbumCoverManager:getAlbumCoverManager,
            $anchor:$self,
            getPlaylist:getPlaylist
        };
    };

    $.fn.ttwClarityPlayer = function (myPlaylist, userOptions) {

        return new ClarityPlayer(this, myPlaylist, userOptions);
    };

})(jQuery);