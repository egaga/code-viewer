val minamina = 13

fun List_isEmpty list = true

fun map_ rest mapped f =
    if List_isEmpty rest then
        mapped
    else
        5

val x = map_ 5 [minamina, [minamina+5]]

(*
val x = map_ [1, 2, 3] [2] minamina
fun map_ rest mapped f =
    if List.isEmpty rest then
        mapped
    else
        5

fun map_ rest mapped f =
    if List.isEmpty rest then
        mapped
    else
        map_ (List.tail rest) (f (List.head rest))

fun List.isEmpty list = false

fun map list f =
    map_ list [] f
*)
