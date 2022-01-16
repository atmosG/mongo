'use strict';

$('.btn-box').click( event => {
    const target = event.target.className;
    const postNumber = event.currentTarget.dataset.id;
    switch (target) {
        case 'btn silver put':
            location.href = `/edit/${postNumber}`
            break
        case 'btn silver delete':
            $.ajax({
                method : 'DELETE',
                url : `/delete/${postNumber}`
            }).done( res => {
                location.href = `/`
            })
            break;
    }
})