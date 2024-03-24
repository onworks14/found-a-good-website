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
var player = new Player([
  {
    title: "By Your Side",
    // "Jonas Blue",
    howl: null, // "by_your_side",
    file: "by_your_side",
  },
  {
    title: "CONTIGO",
    // "KAROL G",
    howl: null, // "contigo",
    file: "contigo",
  },
  {
    title: "Baby I Need You",
    // "sped up 8282&Joosiq",
    howl: null, // "baby_i_need_you",
    file: "baby_i_need_you",
  },
  {
    title: "一个人想着一个人",
    // "曾沛慈",
    howl: null, // "一个人想着一个人",
    file: "一个人想着一个人",
  },
  {
    title: "秘密",
    // "蓝又时",
    howl: null, // "秘密_蓝又时",
    file: "秘密_蓝又时",
  },
  {
    title: "Gone",
    // "Rose",
    howl: null, // "gone_rose",
    file: "gone_rose",
  },
  {
    title: "手放开",
    // "李圣杰",
    howl: null, // "手放开",
    file: "手放开",
  },
  {
    title: "情人",
    // "杜德伟",
    howl: null, // "情人_杜德伟",
    file: "情人_杜德伟",
  },
  {
    title: "听见下雨的声音",
    // "周杰伦",
    howl: null, // "听见下雨的声音",
    file: "听见下雨的声音",
  },
  {
    title: "胆小鬼",
    // "梁咏琪",
    howl: null, // "胆小鬼_梁咏琪",
    file: "胆小鬼_梁咏琪",
  },
  {
    title: "梦寐以求",
    // "王力宏",
    howl: null, // "梦寐以求",
    file: "梦寐以求",
  },
  {
    title: "致爱(Your Song)",
    // "鹿晗",
    howl: null, // "致爱_your_song",
    file: "致爱_your_song",
  },
  {
    title: "Party",
    // "少女时代",
    howl: null, // "love_is_gone",
    file: "party_少女时代",
  },
  {
    title: "目及皆是你",
    // "小蓝背心",
    howl: null, // "目及皆是你",
    file: "目及皆是你",
  },
  {
    title: "静悄悄",
    // "陈泫孝",
    howl: null, // "静悄悄",
    file: "静悄悄",
  },
  {
    title: "Ringa Linga",
    // "太阳",
    howl: null, // "ringa_linga",
    file: "ringa_linga",
  },
  {
    title: "超级冠军",
    // "鹿晗",
    howl: null, // "超级冠军",
    file: "超级冠军",
  },
  {
    title: "On My Own",
    // "Ashes Remain",
    howl: null, // "on_my_own",
    file: "on_my_own",
  },
  {
    title: "明天你好",
    // "牛奶咖啡",
    howl: null, // "明天你好_牛奶咖啡",
    file: "明天你好_牛奶咖啡",
  },
  {
    title: "半岛铁盒",
    // "周杰伦",
    howl: null, // "半岛铁盒",
    file: "半岛铁盒",
  },
  {
    title: "超级风格",
    // "SpeXial",
    howl: null, // "超级风格",
    file: "超级风格",
  },
  {
    title: "鸭梨大",
    // "至上励合",
    howl: null, // "鸭梨大",
    file: "鸭梨大",
  },
  {
    title: "Anti Hero",
    // "Taylor Swift",
    howl: null, // "anti_hero",
    file: "anti_hero",
  },
  {
    title: "Butterfly",
    // "BTS",
    howl: null, // "butterfly_bts",
    file: "butterfly_bts",
  },
  {
    title: "Empty",
    // "Winner",
    howl: null, // "empty_winner",
    file: "empty_winner",
  },
  {
    title: "How You Like That",
    // "BlackPink",
    howl: null, // "how_you_like_that",
    file: "how_you_like_that",
  },
  {
    title: "爱很简单",
    // "陶喆",
    howl: null, // "爱很简单",
    file: "爱很简单",
  },
  {
    title: "寂寞烟火",
    // "蓝心羽",
    howl: null, // "寂寞烟火",
    file: "寂寞烟火",
  },
  {
    title: "像鱼",
    // "王贰浪",
    howl: null, // "像鱼",
    file: "像鱼",
  },
  {
    title: "侧脸",
    // "于果",
    howl: null, // "侧脸",
    file: "侧脸",
  },
  {
    title: "可爱女人",
    // "周杰伦",
    howl: null, // "可爱女人",
    file: "可爱女人",
  },
  {
    title: "Mojito",
    // "周杰伦",
    howl: null, // "mojito",
    file: "mojito",
  },
  {
    title: "Workingman's Blues #2",
    // "Bob Dylan",
    howl: null, // "workingmans_blues",
    file: "workingmans_blues",
  },
  {
    title: "风吹一夏",
    // "DP龙猪",
    howl: null, // "风吹一夏",
    file: "风吹一夏",
  },
  {
    title: "Fragrance",
    // "mahiru",
    howl: null, // "mahiru_fragrance",
    file: "mahiru_fragrance",
  },
  {
    title: "Like I Do",
    // "J.Tajor",
    howl: null, // "like_i_do",
    file: "like_i_do",
  },
  {
    title: "心墙",
    // "郭静",
    howl: null, // "心墙_郭静",
    file: "心墙_郭静",
  },
  {
    title: "Style",
    // "Taylor Swift",
    howl: null, // "style_taylor",
    file: "style_taylor",
  },
  {
    title: "失落沙洲",
    // "徐佳莹",
    howl: null, // "失落沙洲",
    file: "失落沙洲",
  },
  {
    title: "就是爱你",
    // "陶喆",
    howl: null, // "就是爱你",
    file: "就是爱你",
  },
  {
    title: "练习",
    // "刘德华",
    howl: null, // "练习",
    file: "练习",
  },
  {
    title: "第一次",
    // "光良",
    howl: null, // "第一次",
    file: "第一次",
  },
  {
    title: "独家记忆",
    // "陈小春",
    howl: null, // "独家记忆",
    file: "独家记忆",
  },
  {
    title: "醉清风",
    // "弦子",
    howl: null, // "醉清风",
    file: "醉清风",
  },
  {
    title: "七里香",
    // "周杰伦",
    howl: null, // "七里香",
    file: "七里香",
  },
  {
    title: "会呼吸的痛",
    // "任雪晨",
    howl: null, // "会呼吸的痛",
    file: "会呼吸的痛",
  },
  {
    title: "囚鸟",
    // "王小帅",
    howl: null, // "囚鸟",
    file: "囚鸟",
  },
  {
    title: "忽然之间",
    // "莫文蔚",
    howl: null, // "忽然之间",
    file: "忽然之间",
  },
  {
    title: "情非得已",
    // "庾澄庆",
    howl: null, // "情非得已",
    file: "情非得已",
  },
  {
    title: "背叛",
    // "曹格",
    howl: null, // "背叛",
    file: "背叛",
  },
  {
    title: "永不失联的爱",
    // "周兴哲",
    howl: null, // "永不失联的爱",
    file: "永不失联的爱",
  },
  {
    title: "Letting Go",
    // "蔡健雅",
    howl: null, // "letting_go",
    file: "letting_go",
  },
  {
    title: "2am (feat. 茉ひる)",
    // "VILLSHANA",
    howl: null, // "am2_feat",
    file: "am2_feat",
  },
  {
    title: "慢冷",
    // "王一楠",
    howl: null, // "慢冷",
    file: "慢冷",
  },
  {
    title: "爱我别走",
    // "张震岳",
    howl: null, // "爱我别走",
    file: "爱我别走",
  },
  {
    title: "听海",
    // "张惠妹",
    howl: null, // "听海",
    file: "听海",
  },
  {
    title: "慢慢喜欢你",
    // "莫文蔚",
    howl: null, // "慢慢喜欢你",
    file: "慢慢喜欢你",
  },
  {
    title: "恶作剧",
    // "王蓝菌",
    howl: null, // "恶作剧",
    file: "恶作剧",
  },
  {
    title: "哭泣健康指南",
    // "李幸倪",
    howl: null, // "哭泣健康指南",
    file: "哭泣健康指南",
  },
  {
    title: "唯一",
    // "告五人",
    howl: null, // "唯一_告五人",
    file: "唯一_告五人",
  },
  {
    title: "浪费",
    // "林宥嘉",
    howl: null, // "浪费",
    file: "浪费",
  },
  {
    title: "煎熬",
    // "李佳薇",
    howl: null, // "煎熬",
    file: "煎熬",
  },
  {
    title: "你就不要想起我",
    // "田馥甄",
    howl: null, // "你就不要想起我",
    file: "你就不要想起我",
  },
  {
    title: "年轮",
    // "张碧晨",
    howl: null, // "年轮",
    file: "年轮",
  },
  {
    title: "以后别做朋友",
    // "周兴哲",
    howl: null, // "以后别做朋友",
    file: "以后别做朋友",
  },
  {
    title: "关键词",
    // "林俊杰",
    howl: null, // "关键词",
    file: "关键词",
  },
  {
    title: "不为谁而作的歌",
    // "林俊杰",
    howl: null, // "不为谁而作的歌",
    file: "不为谁而作的歌",
  },
  {
    title: "Good bye",
    // "HYOLYN",
    howl: null, // "hyolyn_goodbye",
    file: "hyolyn_goodbye",
  },
  {
    title: "爱上未来的你",
    // "潘玮柏",
    howl: null, // "爱上未来的你",
    file: "爱上未来的你",
  },
  {
    title: "Need Conversation",
    // "Jeong Hyo Bin&Joosiq",
    howl: null, // "need_conversation",
    file: "need_conversation",
  },
  {
    title: "More Than Words",
    // "피아노맨&Joosiq",
    howl: null, // "more_than_words",
    file: "more_than_words",
  },
  {
    title: "Dear my X",
    // "KyoungSeo",
    howl: null, // "dear_my_x",
    file: "dear_my_x",
  },
  {
    title: "天后",
    // "陈势安",
    howl: null, // "天后",
    file: "天后",
  },
  {
    title: "exes",
    // "Tate McRae",
    howl: null, // "exes",
    file: "exes",
  },
  {
    title: "greedy",
    // "Tate McRae",
    howl: null, // "greedy",
    file: "greedy",
  },
  {
    title: "Better Off",
    // "Alan Walker",
    howl: null, // "better_off",
    file: "better_off",
  },
  {
    title: "Alone",
    // "Marshmello",
    howl: null, // "marshmello_alone",
    file: "marshmello_alone",
  },
  {
    title: "Work from Home",
    // "Fifth Harmony",
    howl: null, // "work_from_home",
    file: "work_from_home",
  },
  {
    title: "Don't Start Now",
    // "Dua Lipa",
    howl: null, // "dont_start_now",
    file: "dont_start_now",
  },
  {
    title: "Can't Feel My Face",
    // "The Weeknd",
    howl: null, // "cant_feel_my_face",
    file: "cant_feel_my_face",
  },
  {
    title: "Monsters",
    // "Katie Sky",
    howl: null, // "monsters",
    file: "monsters",
  },
  {
    title: "Titanium",
    // "David Guetta",
    howl: null, // "titanium",
    file: "titanium",
  },
  {
    title: "Summer",
    // "Calvin Harris",
    howl: null, // "summer_ch",
    file: "summer_ch",
  },
  {
    title: "Better Off Alone",
    // "Josh Le Tissie",
    howl: null, // "better_off_alone",
    file: "better_off_alone",
  },
  {
    title: "Better Days",
    // "Polo G",
    howl: null, // "better_days",
    file: "better_days",
  },
  {
    title: "Green Green Grass",
    // "George Ezra",
    howl: null, // "green_green_grass",
    file: "green_green_grass",
  },
  {
    title: "Havana",
    // "Camila Cabello",
    howl: null, // "havana",
    file: "havana",
  },
  {
    title: "Rather Be",
    // "Clean Bandit",
    howl: null, // "rather_be",
    file: "rather_be",
  },
  {
    title: "Baby Don’t Hurt Me",
    // "David Guetta",
    howl: null, // "baby_dont_hurt_me",
    file: "baby_dont_hurt_me",
  },
  {
    title: "Tik Tok",
    // "Kesha",
    howl: null, // "tiktok",
    file: "tiktok",
  },
  {
    title: "Vampire",
    // "Olivia Rodrigo",
    howl: null, // "vampire",
    file: "vampire",
  },
  {
    title: "Die Young",
    // "Kesha",
    howl: null, // "die_young",
    file: "die_young",
  },
  {
    title: "Timber",
    // "Kesha",
    howl: null, // "timber",
    file: "timber",
  },
  {
    title: "it is what it is",
    // "Abe Parker",
    howl: null, // "it_is_what_it_is",
    file: "it_is_what_it_is",
  },
  {
    title: "Happier By Now",
    // "Kai Wachi",
    howl: null, // "happier_by_now",
    file: "happier_by_now",
  },
  {
    title: "Levitating",
    // "Dua Lipa",
    howl: null, // "levitating",
    file: "levitating",
  },
  {
    title: "Down",
    // "Jay Sean",
    howl: null, // "down_js",
    file: "down_js",
  },
  {
    title: "Let Me Love You",
    // "DJ Snake",
    howl: null, // "let_me_love_you",
    file: "let_me_love_you",
  },
  {
    title: "You Don't Know Me",
    // "Ofenbach",
    howl: null, // "baby_you_dont_know_me",
    file: "baby_you_dont_know_me",
  },
  {
    title: "Diff.",
    // "Gin Lee",
    howl: null, // "diff",
    file: "diff",
  },
  {
    title: "离开地球表面",
    // "五月天",
    howl: null, // "离开地球表面",
    file: "离开地球表面",
  },
  {
    title: "让我留在你身边",
    // "陈奕迅",
    howl: null, // "让我留在你身边",
    file: "让我留在你身边",
  },
  {
    title: "怒放",
    // "G-Dragon",
    howl: null, // "怒放",
    file: "怒放",
  },
  {
    title: "Two at A Time",
    // "AGA",
    howl: null, // "two_at_a_time",
    file: "two_at_a_time",
  },
  {
    title: "皮思苦",
    // "陳瑞輝",
    howl: null, // "皮思苦",
    file: "皮思苦",
  },
  {
    title: "INYU",
    // "TAEYEON",
    howl: null, // "inyu",
    file: "inyu",
  },
  {
    title: "Favourite Jeans",
    // "moon tang",
    howl: null, // "favourite_jeans",
    file: "favourite_jeans",
  },
  {
    title: "万人邂逅",
    // "陈咏桐",
    howl: null, // "万人邂逅",
    file: "万人邂逅",
  },
  {
    title: "abcdefu",
    // "GAYLE",
    howl: null, // "abcdefu",
    file: "abcdefu",
  },
  {
    title: "Someone You Loved",
    // "刘易斯·卡帕尔迪",
    howl: null, // "someone_you_loved",
    file: "someone_you_loved",
  },
  {
    title: "I Hate Myself Sometimes",
    // "李浩瑋",
    howl: null, // "i_hate_myself_sometimes",
    file: "i_hate_myself_sometimes",
  },
  {
    title: "Sweet but Psycho",
    // "Ava Max",
    howl: null, // "sweet_but_psycho",
    file: "sweet_but_psycho",
  },
  {
    title: "Love U Like That",
    // "Lauv",
    howl: null, // "love_u_like_that",
    file: "love_u_like_that",
  },
  {
    title: "All Fails Down",
    // "Alan Walker",
    howl: null, // "all_fails_down",
    file: "all_fails_down",
  },
  {
    title: "Savage Love",
    // "Jawsh 685",
    howl: null, // "savage_love",
    file: "savage_love",
  },
  {
    title: "Price Tag",
    // "Jessie J",
    howl: null, // "price_tag",
    file: "price_tag",
  },
  {
    title: "Counting Stars",
    // "OneRepublic",
    howl: null, // "counting_stars",
    file: "counting_stars",
  },
  {
    title: "Love Is Gone",
    // "SLANDER",
    howl: null, // "love_is_gone",
    file: "love_is_gone",
  },
  {
    title: "How To Love ft Sofia Reyes",
    // "Cash Cash",
    howl: null, // "how_to_love_ft",
    file: "how_to_love_ft",
  },
  {
    title: "In The Name Of Love",
    // "Martin Garrix",
    howl: null, // "in_the_name_of_love",
    file: "in_the_name_of_love",
  },
  {
    title: "Ghost",
    // "Justin Bieber",
    howl: null, // "jb_ghost",
    file: "jb_ghost",
  },
  {
    title: "Why Don't We",
    // "8 Letters",
    howl: null, // "why_dont_we",
    file: "why_dont_we",
  },
  {
    title: "Pretty Girl",
    // "Maggie Lindemann",
    howl: null, // "pretty_girl",
    file: "pretty_girl",
  },
  {
    title: "The Middle",
    // "Zedd, Maren",
    howl: null, // "the_middle",
    file: "the_middle",
  },
  {
    title: "Hall of Fame",
    // "The Script",
    howl: null, // "hall_of_fame",
    file: "hall_of_fame",
  },
  {
    title: "Intentions",
    // "Justin Bieber",
    howl: null, // "Intentions",
    file: "Intentions",
  },
  {
    title: "Roar",
    // "Katy Perry",
    howl: null, // "Roar",
    file: "Roar",
  },
  {
    title: "The Nights",
    // "Avicii",
    howl: null, // "the_nights",
    file: "the_nights",
  },
  {
    title: "Shake It Off",
    // "Taylor Swift",
    howl: null, // "shake_it_off",
    file: "shake_it_off",
  },
  {
    title: "Love Me Like You Do",
    // "Ellie Goulding",
    howl: null, // "love_me_like_you_do",
    file: "love_me_like_you_do",
  },
  {
    title: "Firework",
    // "Katy Perry",
    howl: null, // "firework_kp",
    file: "firework_kp",
  },
  {
    title: "Dandelions",
    // "Ruth B",
    howl: null, // "Dandelions_rb",
    file: "Dandelions_rb",
  },
  {
    title: "Habits",
    // "Tove Lo",
    howl: null, // "habits_tl",
    file: "habits_tl",
  },
  {
    title: "24/7, 365",
    // "elijah woods",
    howl: null, // "ew_24",
    file: "ew_24",
  },
  {
    title: "Normal No More",
    // "Vietsub",
    howl: null, // "normal_no_more",
    file: "normal_no_more",
  },
  {
    title: "Fool For You",
    // "Kastra",
    howl: null, // "fool_for_you",
    file: "fool_for_you",
  },
  {
    title: "In The Shadow Of The Sun",
    // "Professor Green",
    howl: null, // "in_the_shadow_of_the_sun",
    file: "in_the_shadow_of_the_sun",
  },
  {
    title: "I Don't Care",
    // "Ed Sheeran & Justin Bieber",
    howl: null, // "i_dont_care",
    file: "i_dont_care",
  },
  {
    title: "Sunroof",
    // "Nicky Youre, dazy",
    howl: null, // "sunroof",
    file: "sunroof",
  },
  {
    title: "If I Cant Have You",
    // "Shawn Mendes",
    howl: null, // "if_i_cant_have_you",
    file: "if_i_cant_have_you",
  },
  {
    title: "Rain on Me",
    // "Lady Gaga",
    howl: null, // "rain_on_me",
    file: "rain_on_me",
  },
  {
    title: "Stitches",
    // "Shawn Mendes",
    howl: null, // "Stitches",
    file: "Stitches",
  },
  {
    title: "Say You Won't Let Go",
    // "James Arthur",
    howl: null, // "say_you_wont_let_go",
    file: "say_you_wont_let_go",
  },
  {
    title: "Way Back Home",
    // "SHAUN",
    howl: null, // "way_back_home",
    file: "way_back_home",
  },
  {
    title: "Little Bit Better",
    // "Caleb Hearn & ROSIE",
    howl: null, // "little_bit_better",
    file: "little_bit_better",
  },
  {
    title: "Drunk Text",
    // "Henry Moodie",
    howl: null, // "drunk_text",
    file: "drunk_text",
  },
  {
    title: "Night Changes",
    // "One Direction",
    howl: null, // "night_changes",
    file: "night_changes",
  },
  {
    title: "comethru",
    // "Jeremy Zucker",
    howl: null, // "comethru",
    file: "comethru",
  },
  {
    title: "Magic",
    // "Super Junior",
    howl: null, // "super_junoir_magic",
    file: "super_junoir_magic",
  },
  {
    title: "I'm the One",
    // "Justin Bieber",
    howl: null, // "i_am_the_one",
    file: "i_am_the_one",
  },
  {
    title: "Deep End",
    // "William Black",
    howl: null, // "deep_end",
    file: "deep_end",
  },
  {
    title: "Body Back",
    // "Gryffin",
    howl: null, // "body_back",
    file: "body_back",
  },
  {
    title: "Million Days",
    // "Sabai",
    howl: null, // "million_days",
    file: "million_days",
  },
  {
    title: "失眠飞行",
    // "沈以诚",
    howl: null, // "失眠飞行",
    file: "失眠飞行",
  },
  {
    title: "没有理由",
    // "周延英",
    howl: null, // "没有理由",
    file: "没有理由",
  },
  {
    title: "时光背面的我",
    // "刘至佳",
    howl: null, // "时光背面的我",
    file: "时光背面的我",
  },
  {
    title: "放个大招给你看",
    // "永彬Ryan.B",
    howl: null, // "放个大招给你看",
    file: "放个大招给你看",
  },
  {
    title: "Fatal Love",
    // "Jori King",
    howl: null, // "fatal_love",
    file: "fatal_love",
  },
  {
    title: "Mine (Illenium Remix)",
    // "Phoebe Ryan",
    howl: null, // "pr_mine",
    file: "pr_mine",
  },
  {
    title: "The Way I Still Love You",
    // "Reynard Silva",
    howl: null, // "the_way_i_still_love_you",
    file: "the_way_i_still_love_you",
  },
]);

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
