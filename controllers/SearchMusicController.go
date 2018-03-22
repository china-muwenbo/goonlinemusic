package controllers

import (
	"fmt"
	"github.com/astaxie/beego"
	"../models"
	"encoding/json"
)

//根据艺术家的名字搜索
type SearchMusicController struct {
	beego.Controller
}
func (c *SearchMusicController) Get() {
	serach_content := c.GetString("serach_content")
	_ = c.GetString("need_page")
	fmt.Println("" + serach_content)
	str,err:=GetMusicByName(serach_content, 0)
	if err!=nil {
	}
	c.Ctx.ResponseWriter.Write([]byte(str))
	//c.ServeJSON()
}
func GetMusicByName(serach_content string, page int) (string, error) {
	key := serach_content + string(page)
	fmt.Println(key)
	//判断能不能缓存，或者说要不要缓存
	needca := models.HasCached(serach_content)
	var str string
	var err error
	// 能缓存并且缓存里面有数据
	if needca {
		str, err = models.GetMusicArtistFromCache(key)
		if err != nil {
		}else {
			return str, nil
		}
	}
	//str,err= models.SearchMusicByNameS(name, 1)
	music := models.SearchMusicByName(serach_content, page)
	strmusic,err:=json.Marshal(music)
	if needca {
		models.SetMusicArtist(key, string(strmusic))
	}
	return string(strmusic), err
}

//根据歌手名搜索
func (c *SearchMusicController) Post() {
	serach_content := c.GetString("serach_content")
	_ = c.GetString("need_page")
	fmt.Println("" + serach_content)
	str,err:=GetMusicByName(serach_content, 0)
	if err!=nil {
	}
	c.Ctx.ResponseWriter.Write([]byte(str))
}
