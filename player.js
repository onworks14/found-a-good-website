/*!
 *  Howler.js Audio Player Demo
 *  howlerjs.com
 *
 *  (c) 2013-2017, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

// Cache references to DOM elements.
var elms = [
  "track",
  "timer",
  "duration",
  "playBtn",
  "pauseBtn",
  "prevBtn",
  "nextBtn",
  "playlistBtn",
  "volumeBtn",
  "progress",
  "bar",
  "wave",
  "loading",
  "playlist",
  "list",
  "volume",
  "barEmpty",
  "barFull",
  "sliderBtn",
];
elms.forEach(function (elm) {
  window[elm] = document.getElementById(elm);
});

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function (playlist) {
  this.playlist = playlist;
  this.index = 0;

  // Display the title of the first track.
  track.innerHTML = "1. " + playlist[0].title;

  // Setup the playlist display.
  playlist.forEach(function (song) {
    var div = document.createElement("div");
    div.className = "list-song";
    div.innerHTML = song.title;
    div.onclick = function () {
      player.skipTo(playlist.indexOf(song));
    };
    list.appendChild(div);
  });
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function (index) {
    var self = this;
    var sound;

    index = typeof index === "number" ? index : self.index;
    var data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: ["https://colddb.netlify.app/audio/" + data.file + ".mp3"],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function () {
          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          wave.container.style.display = "block";
          bar.style.display = "none";
          pauseBtn.style.display = "block";
        },
        onload: function () {
          // Start the wave animation.
          wave.container.style.display = "block";
          bar.style.display = "none";
          loading.style.display = "none";
        },
        onend: function () {
          // Stop the wave animation.
          wave.container.style.display = "none";
          bar.style.display = "block";
          self.skip("right");
        },
        onpause: function () {
          // Stop the wave animation.
          wave.container.style.display = "none";
          bar.style.display = "block";
        },
        onstop: function () {
          // Stop the wave animation.
          wave.container.style.display = "none";
          bar.style.display = "block";
        },
      });
    }

    // Begin playing the sound.
    sound.play();

    // Update the track display.
    track.innerHTML = index + 1 + ". " + data.title;

    // Show the pause button.
    if (sound.state() === "loaded") {
      playBtn.style.display = "none";
      pauseBtn.style.display = "block";
    } else {
      loading.style.display = "block";
      playBtn.style.display = "none";
      pauseBtn.style.display = "none";
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function () {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    // Show the play button.
    playBtn.style.display = "block";
    pauseBtn.style.display = "none";
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function (direction) {
    var self = this;

    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === "prev") {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function (index) {
    var self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = "0%";

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function (val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = barWidth * 100 + "%";
    sliderBtn.style.left =
      window.innerWidth * barWidth + window.innerWidth * 0.05 - 25 + "px";
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function (per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function () {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = ((seek / sound.duration()) * 100 || 0) + "%";

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function () {
    var self = this;
    var display = playlist.style.display === "block" ? "none" : "block";

    setTimeout(
      function () {
        playlist.style.display = display;
      },
      display === "block" ? 0 : 500,
    );
    playlist.className = display === "block" ? "fadein" : "fadeout";
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function () {
    var self = this;
    var display = volume.style.display === "block" ? "none" : "block";

    setTimeout(
      function () {
        volume.style.display = display;
      },
      display === "block" ? 0 : 500,
    );
    volume.className = display === "block" ? "fadein" : "fadeout";
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function (secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = secs - minutes * 60 || 0;

    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  },
};

// Setup our new audio player class and pass it the playlist.
var player = new Player([{title:"By Your Side",file:"by_your_side",howl:null},{title:"CONTIGO",file:"contigo",howl:null},{title:"Baby I Need You",file:"baby_i_need_you",howl:null},{title:"一个人想着一个人",file:"一个人想着一个人",howl:null},{title:"秘密",file:"秘密_蓝又时",howl:null},{title:"Gone",file:"gone_rose",howl:null},{title:"手放开",file:"手放开",howl:null},{title:"情人",file:"情人_杜德伟",howl:null},{title:"听见下雨的声音",file:"听见下雨的声音",howl:null},{title:"胆小鬼",file:"胆小鬼_梁咏琪",howl:null},{title:"梦寐以求",file:"梦寐以求",howl:null},{title:"致爱(Your Song)",file:"致爱_your_song",howl:null},{title:"Party",file:"love_is_gone",howl:null},{title:"目及皆是你",file:"目及皆是你",howl:null},{title:"静悄悄",file:"静悄悄",howl:null},{title:"Ringa Linga",file:"ringa_linga",howl:null},{title:"超级冠军",file:"超级冠军",howl:null},{title:"On My Own",file:"on_my_own",howl:null},{title:"明天你好",file:"明天你好_牛奶咖啡",howl:null},{title:"半岛铁盒",file:"半岛铁盒",howl:null},{title:"超级风格",file:"超级风格",howl:null},{title:"鸭梨大",file:"鸭梨大",howl:null},{title:"Anti Hero",file:"anti_hero",howl:null},{title:"Butterfly",file:"butterfly_bts",howl:null},{title:"Empty",file:"empty_winner",howl:null},{title:"How You Like That",file:"how_you_like_that",howl:null},{title:"爱很简单",file:"爱很简单",howl:null},{title:"寂寞烟火",file:"寂寞烟火",howl:null},{title:"像鱼",file:"像鱼",howl:null},{title:"侧脸",file:"侧脸",howl:null},{title:"可爱女人",file:"可爱女人",howl:null},{title:"Mojito",file:"mojito",howl:null},{title:"Workingman's Blues #2",file:"workingmans_blues",howl:null},{title:"风吹一夏",file:"风吹一夏",howl:null},{title:"Fragrance",file:"mahiru_fragrance",howl:null},{title:"Like I Do",file:"like_i_do",howl:null},{title:"心墙",file:"心墙_郭静",howl:null},{title:"Style",file:"style_taylor",howl:null},{title:"失落沙洲",file:"失落沙洲",howl:null},{title:"就是爱你",file:"就是爱你",howl:null},{title:"练习",file:"练习",howl:null},{title:"第一次",file:"第一次",howl:null},{title:"独家记忆",file:"独家记忆",howl:null},{title:"醉清风",file:"醉清风",howl:null},{title:"七里香",file:"七里香",howl:null},{title:"会呼吸的痛",file:"会呼吸的痛",howl:null},{title:"囚鸟",file:"囚鸟",howl:null},{title:"忽然之间",file:"忽然之间",howl:null},{title:"情非得已",file:"情非得已",howl:null},{title:"背叛",file:"背叛",howl:null},{title:"永不失联的爱",file:"永不失联的爱",howl:null},{title:"Letting Go",file:"letting_go",howl:null},{title:"2am (feat. 茉ひる)",file:"am2_feat",howl:null},{title:"慢冷",file:"慢冷",howl:null},{title:"爱我别走",file:"爱我别走",howl:null},{title:"听海",file:"听海",howl:null},{title:"慢慢喜欢你",file:"慢慢喜欢你",howl:null},{title:"恶作剧",file:"恶作剧",howl:null},{title:"哭泣健康指南",file:"哭泣健康指南",howl:null},{title:"唯一",file:"唯一_告五人",howl:null},{title:"浪费",file:"浪费",howl:null},{title:"煎熬",file:"煎熬",howl:null},{title:"你就不要想起我",file:"你就不要想起我",howl:null},{title:"年轮",file:"年轮",howl:null},{title:"以后别做朋友",file:"以后别做朋友",howl:null},{title:"关键词",file:"关键词",howl:null},{title:"不为谁而作的歌",file:"不为谁而作的歌",howl:null},{title:"Good bye",file:"hyolyn_goodbye",howl:null},{title:"爱上未来的你",file:"爱上未来的你",howl:null},{title:"Need Conversation",file:"need_conversation",howl:null},{title:"More Than Words",file:"more_than_words",howl:null},{title:"Dear my X",file:"dear_my_x",howl:null},{title:"天后",file:"天后",howl:null},{title:"exes",file:"exes",howl:null},{title:"greedy",file:"greedy",howl:null},{title:"Better Off",file:"better_off",howl:null},{title:"Alone",file:"marshmello_alone",howl:null},{title:"Work from Home",file:"work_from_home",howl:null},{title:"Don't Start Now",file:"dont_start_now",howl:null},{title:"Can't Feel My Face",file:"cant_feel_my_face",howl:null},{title:"Monsters",file:"monsters",howl:null},{title:"Titanium",file:"titanium",howl:null},{title:"Summer",file:"summer_ch",howl:null},{title:"Better Off Alone",file:"better_off_alone",howl:null},{title:"Better Days",file:"better_days",howl:null},{title:"Green Green Grass",file:"green_green_grass",howl:null},{title:"Havana",file:"havana",howl:null},{title:"Rather Be",file:"rather_be",howl:null},{title:"Baby Don’t Hurt Me",file:"baby_dont_hurt_me",howl:null},{title:"Tik Tok",file:"tiktok",howl:null},{title:"Vampire",file:"vampire",howl:null},{title:"Die Young",file:"die_young",howl:null},{title:"Timber",file:"timber",howl:null},{title:"it is what it is",file:"it_is_what_it_is",howl:null},{title:"Happier By Now",file:"happier_by_now",howl:null},{title:"Levitating",file:"levitating",howl:null},{title:"Down",file:"down_js",howl:null},{title:"Let Me Love You",file:"let_me_love_you",howl:null},{title:"You Don't Know Me",file:"baby_you_dont_know_me",howl:null},{title:"Diff.",file:"diff",howl:null},{title:"离开地球表面",file:"离开地球表面",howl:null},{title:"让我留在你身边",file:"让我留在你身边",howl:null},{title:"怒放",file:"怒放",howl:null},{title:"Two at A Time",file:"two_at_a_time",howl:null},{title:"皮思苦",file:"皮思苦",howl:null},{title:"INYU",file:"inyu",howl:null},{title:"Favourite Jeans",file:"favourite_jeans",howl:null},{title:"万人邂逅",file:"万人邂逅",howl:null},{title:"abcdefu",file:"abcdefu",howl:null},{title:"Someone You Loved",file:"someone_you_loved",howl:null},{title:"I Hate Myself Sometimes",file:"i_hate_myself_sometimes",howl:null},{title:"Sweet but Psycho",file:"sweet_but_psycho",howl:null},{title:"Love U Like That",file:"love_u_like_that",howl:null},{title:"All Fails Down",file:"all_fails_down",howl:null},{title:"Savage Love",file:"savage_love",howl:null},{title:"Price Tag",file:"price_tag",howl:null},{title:"Counting Stars",file:"counting_stars",howl:null},{title:"Love Is Gone",file:"love_is_gone",howl:null},{title:"How To Love ft Sofia Reyes",file:"how_to_love_ft",howl:null},{title:"In The Name Of Love",file:"in_the_name_of_love",howl:null},{title:"Ghost",file:"jb_ghost",howl:null},{title:"Why Don't We",file:"why_dont_we",howl:null},{title:"Pretty Girl",file:"pretty_girl",howl:null},{title:"The Middle",file:"the_middle",howl:null},{title:"Hall of Fame",file:"hall_of_fame",howl:null},{title:"Intentions",file:"Intentions",howl:null},{title:"Roar",file:"Roar",howl:null},{title:"The Nights",file:"the_nights",howl:null},{title:"Shake It Off",file:"shake_it_off",howl:null},{title:"Love Me Like You Do",file:"love_me_like_you_do",howl:null},{title:"Firework",file:"firework_kp",howl:null},{title:"Dandelions",file:"Dandelions_rb",howl:null},{title:"Habits",file:"habits_tl",howl:null},{title:"24/7, 365",file:"ew_24",howl:null},{title:"Normal No More",file:"normal_no_more",howl:null},{title:"Fool For You",file:"fool_for_you",howl:null},{title:"In The Shadow Of The Sun",file:"in_the_shadow_of_the_sun",howl:null},{title:"I Don't Care",file:"i_dont_care",howl:null},{title:"Sunroof",file:"sunroof",howl:null},{title:"If I Cant Have You",file:"if_i_cant_have_you",howl:null},{title:"Rain on Me",file:"rain_on_me",howl:null},{title:"Stitches",file:"Stitches",howl:null},{title:"Say You Won't Let Go",file:"say_you_wont_let_go",howl:null},{title:"Way Back Home",file:"way_back_home",howl:null},{title:"Little Bit Better",file:"little_bit_better",howl:null},{title:"Drunk Text",file:"drunk_text",howl:null},{title:"Night Changes",file:"night_changes",howl:null},{title:"comethru",file:"comethru",howl:null},{title:"Magic",file:"super_junoir_magic",howl:null},{title:"I'm the One",file:"i_am_the_one",howl:null},{title:"Deep End",file:"deep_end",howl:null},{title:"Body Back",file:"body_back",howl:null},{title:"Million Days",file:"million_days",howl:null},{title:"失眠飞行",file:"失眠飞行",howl:null},{title:"没有理由",file:"没有理由",howl:null},{title:"时光背面的我",file:"时光背面的我",howl:null},{title:"放个大招给你看",file:"放个大招给你看",howl:null},{title:"Fatal Love",file:"fatal_love",howl:null},{title:"Mine (Illenium Remix)",file:"pr_mine",howl:null},{title:"The Way I Still Love You",file:"the_way_i_still_love_you",howl:null},{title:"Sunburst",file:"sunburst",howl:null},{title:"Something Strange",file:"something_strange",howl:null},{title:"Save Me",file:"save_me",howl:null},{title:"Meant To Be",file:"meant_to_be",howl:null},{title:"Make Me Move",file:"make_me_move",howl:null},{title:"Run Free",file:"run_free",howl:null},{title:"Fractures",file:"fractures",howl:null},{title:"Drown",file:"drown",howl:null},{title:"Home (Blaze U Remix)",file:"bz_home",howl:null},{title:"Where Is Your Love",file:"where_is_your_love",howl:null}]);

// Bind our player controls.
playBtn.addEventListener("click", function () {
  player.play();
});
pauseBtn.addEventListener("click", function () {
  player.pause();
});
prevBtn.addEventListener("click", function () {
  player.skip("prev");
});
nextBtn.addEventListener("click", function () {
  player.skip("next");
});
waveform.addEventListener("click", function (event) {
  player.seek(event.clientX / window.innerWidth);
});
playlistBtn.addEventListener("click", function () {
  player.togglePlaylist();
});
playlist.addEventListener("click", function () {
  player.togglePlaylist();
});
volumeBtn.addEventListener("click", function () {
  player.toggleVolume();
});
volume.addEventListener("click", function () {
  player.toggleVolume();
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener("click", function (event) {
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener("mousedown", function () {
  window.sliderDown = true;
});
sliderBtn.addEventListener("touchstart", function () {
  window.sliderDown = true;
});
volume.addEventListener("mouseup", function () {
  window.sliderDown = false;
});
volume.addEventListener("touchend", function () {
  window.sliderDown = false;
});

var move = function (event) {
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(
      1,
      Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)),
    );
    player.volume(per);
  }
};

volume.addEventListener("mousemove", move);
volume.addEventListener("touchmove", move);

// Setup the "waveform" animation.
var wave = new SiriWave({
  container: waveform,
  width: window.innerWidth,
  height: window.innerHeight * 0.3,
  cover: true,
  speed: 0.03,
  amplitude: 0.7,
  frequency: 2,
});
wave.start();

// Update the height of the wave animation.
// These are basically some hacks to get SiriWave.js to do what we want.
var resize = function () {
  var height = window.innerHeight * 0.3;
  var width = window.innerWidth;
  wave.height = height;
  wave.height_2 = height / 2;
  wave.MAX = wave.height_2 - 4;
  wave.width = width;
  wave.width_2 = width / 2;
  wave.width_4 = width / 4;
  wave.canvas.height = height;
  wave.canvas.width = width;
  wave.container.style.margin = -(height / 2) + "px auto";

  // Update the position of the slider.
  var sound = player.playlist[player.index].howl;
  if (sound) {
    var vol = sound.volume();
    var barWidth = vol * 0.9;
    sliderBtn.style.left =
      window.innerWidth * barWidth + window.innerWidth * 0.05 - 25 + "px";
  }
};
window.addEventListener("resize", resize);
resize();
