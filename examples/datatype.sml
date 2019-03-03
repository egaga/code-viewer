datatype Puu = Tyhja | Haara of int ! Puu ! Puu

(*
todo use * instead of !
- pattern matching for datatype
- data constructor is actually first class function, so the following should work
 datatype Arvo = Ar of int
 map [1, 2, 3] Ar
*)