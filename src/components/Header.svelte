<!-- Tampilan -->
<nav class="navbar navbar-expand-md navbar-dark bg-gradient-1 bg-dark shadow-md">
    <div class="container-fluid">
        <a class="ml-3 navbar-brand" href="#"><strong>Navbar</strong>
        </a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExample03"
            aria-controls="navbarsExample03 p-0 border-0" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="ml-3 collapse navbar-collapse" id="navbarsExample03">
            <ul class="navbar-nav mr-auto mb-2 mb-sm-0">
                <li class="nav-item active">
                    <a class="nav-link" aria-current="page" href="#">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">Features
                    </a>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="dropdown03" data-toggle="dropdown"
                        aria-expanded="false">Dropdown</a>
                    <ul class="dropdown-menu" aria-labelledby="dropdown03">
                        <li><a class="dropdown-item" href="#">Action</a></li>
                        <li><a class="dropdown-item" href="#">Another action</a></li>
                        <li><a class="dropdown-item" href="#">Something else here</a></li>
                    </ul>
                </li>
            </ul>
            <form class="mr-5">
                <input class="form-control" type="text" placeholder="Search" aria-label="Search">
            </form>
            <br>
            <button class="btn btn-outline-success mr-3" type="button" data-toggle="modal"
                data-target="#modalDaftar">Daftar</button>
            <button class="btn btn-primary mr-3" type="button" data-toggle="modal"
                data-target="#modalMasuk">Masuk</button>
        </div>
    </div>
</nav>