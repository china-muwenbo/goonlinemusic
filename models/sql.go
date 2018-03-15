package main

import (
	"github.com/astaxie/beego/orm"

)

type Muisc struct {

	mp3 string
	duration string
	cover string
	title string
	artist string
	background string
}

func init() {
	// set default database
	orm.RegisterDataBase("default", "mysql", "root:muwenbo@tcp(123.207.215.205:3306)/muisc?charset=utf8", 30)

	orm.RunSyncdb("default", false, true)

}

func Test(){

	orm.NewOrm()
	//o := orm.NewOrm()
	//o.Using("default") // 默认使用 default，你可以指定为其他数据库
	//var music Muisc
	//err := o.Raw("SELECT * FROM musicinfo WHERE id = ?", 20000).QueryRow(&music)
	//if err !=nil {
	//	fmt.Println("查询出错")
	//}
	orm.RunCommand()
}
func main()  {
	Test()
}