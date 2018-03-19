package routers

import (

	"github.com/astaxie/beego"
	"../controllers"
)

func Init() {
    beego.Router("/", &controllers.MainController{})
    beego.Router("/getMusic", &controllers.GetMusicController{})
    beego.Router("/serach_byArtistName", &controllers.SearchMusicController{})
    beego.Router("/serach_bySongName", &controllers.SearchMusicByTitleController{})
}
