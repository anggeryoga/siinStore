// Dummy data untuk QRIS (Anda bisa mengganti dengan data QRIS Anda)
const qrisInput = "00020101021126710019ID.CO.CIMBNIAGA.WWW011893600022000040943502150000083009010470303UMI51450015ID.OR.QRNPG.WWW0215ID10221659161000303UMI5204599953033605802ID5914MITRABL*5007216006JEPARA61055941162120708M006057163042A1F";
const waNumber = '6285155145788';
const appScriptURL = 'https://script.google.com/macros/s/AKfycbxLJ9uFuNApYtLNRaBo6DnDtI-DXQZ2qLOOQgMWGoMHthbjQaf6kD91kYKSnldPEbcM_A/exec'; // URL web app Anda


// Data produk dalam format JavaScript
const products = [
   {
        id: 1,
        name: "Ebook Panduan Pemrograman",
        price: 15000,
        discount: 10,
        imageUrl: "https://placekitten.com/200/200", // URL gambar produk 1
    },
    {
        id: 2,
        name: "Template Desain Grafis",
         price: 20000,
         discount: 0,
         imageUrl: "https://placekitten.com/201/201", // URL gambar produk 2
    },
    {
        id: 3,
        name: "Kursus Video Editing",
        price: 25000,
         discount: 15,
          imageUrl: "https://placekitten.com/202/202", // URL gambar produk 3
    },
    {
        id: 4,
        name: "Preset Lightroom Mobile",
         price: 30000,
         discount: 20,
          imageUrl: "https://placekitten.com/203/203", // URL gambar produk 4
     },
];

// Fungsi untuk menambahkan padding pada angka
function pad(number) {
    return number < 10 ? '0' + number : number.toString();
}

// Fungsi untuk menghitung CRC16
function toCRC16(input) {
    let crc = 0xFFFF;
    for (let i = 0; i < input.length; i++) {
        crc ^= input.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    let hex = (crc & 0xFFFF).toString(16).toUpperCase();
    return hex.length === 3 ? "0" + hex : hex;
}

// Fungsi untuk membuat string QRIS dinamis
function makeString(qris, { nominal } = {}) {
    let qrisModified = qris.slice(0, -4).replace("010211", "010212");
    let qrisParts = qrisModified.split("5802ID");

    let amount = "54" + pad(nominal.toString().length) + nominal;
    amount += "5802ID";

    let output = qrisParts[0].trim() + amount + qrisParts[1].trim();
    output += toCRC16(output);

    return output;
}

document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('purchaseModal');
    const productList = document.getElementById('productList');
    const closeButton = document.querySelector('.close-button');
     const confirmPaymentButton = document.getElementById('confirmPaymentButton');

    function calculateDiscountedPrice(price, discount) {
            if (discount > 0) {
              const discountAmount = price * (discount / 100);
              return price - discountAmount;
           }
           return price;
       }

    // Fungsi untuk generate product card
    function generateProductCards() {
        products.forEach(product => {
          const discountedPrice = calculateDiscountedPrice(product.price, product.discount);
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.productId = product.id;
        productCard.dataset.productPrice = discountedPrice;


        let priceHTML = `
            <p>Harga: Rp ${product.price.toLocaleString()}</p>
        `;

        let discountLabel = '';
        if (product.discount > 0) {
           priceHTML = `
                <p style="text-decoration: line-through; color: #999;">Rp ${product.price.toLocaleString()}</p>
                <p style="color: #FF0000; font-weight: bold;">Rp ${discountedPrice.toLocaleString()}  </p>
            `;
             discountLabel = `<span class="discount-label">-${product.discount}%</span>`;
        }

        productCard.innerHTML = `
            ${discountLabel}
            <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
            <h3>${product.name}</h3>
            ${priceHTML}
             <button class="buy-button" data-product-id="${product.id}" data-product-price="${discountedPrice}">Beli</button>
        `;
        productList.appendChild(productCard);
         });

        // Tambahkan event listener ke tombol beli yang baru dibuat
        const buyButtons = document.querySelectorAll('.buy-button');
        buyButtons.forEach(button => {
            button.addEventListener('click', function() {
                 const productId = this.dataset.productId;
                 const productPrice = this.dataset.productPrice;
                 const productCard = this.closest('.product-card');
                 const productName = productCard.querySelector('h3').textContent;
    
                 document.getElementById('productIdInput').value = productId;
                 document.getElementById('productPriceInput').value = productPrice;
                 document.getElementById('productName').textContent = productName;
                 modal.style.display = "flex";
    
                const qrcodeElement = document.getElementById('qrcode');
                qrcodeElement.innerHTML = '';
        });
    });
}
  generateProductCards();

    
     
    closeButton.addEventListener('click', function() {
      modal.style.display = "none";
    });

  window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

        // Fungsi untuk membuat QRIS dan menampilkannya
    document.getElementById('generateButton').addEventListener('click', function() {
        const productId = document.getElementById('productIdInput').value;
        const productName = document.getElementById('productName').textContent;
        const productPrice = document.getElementById('productPriceInput').value;
        const name = document.getElementById('nameInput').value.trim();
        const email = document.getElementById('emailInput').value.trim();
        const phone = document.getElementById('phoneInput').value.trim();
        const qrcodeElement = document.getElementById('qrcode');
        

         // Validasi input
        if (!name || !email || !phone) {
              alert('Mohon isi semua kolom yang wajib diisi.');
              return;
           }


        const nominal = parseInt(productPrice);

        if (!nominal || nominal < 1000) {
          alert('Minimal nominal adalah Rp1.000');
          return;
        }

         const qrisDinamis = makeString(qrisInput, { nominal: nominal });
            qrcodeElement.innerHTML = '';
            
            QRCode.toCanvas(qrisDinamis, { 
                margin: 2, 
                width: 200,
                scale: 8
            }, function (err, canvas) {
                if (err) {
                    console.error(err);
                    alert('Gagal membuat QR Code');
                } else {
                    qrcodeElement.appendChild(canvas);
                }
            });
         
             const data = {
                    nama: name,
                    email: email,
                    nomorHp: phone,
                    hargaProduk: productPrice,
                    namaBarang: productName
                  };

                fetch(appScriptURL, {
                        method: 'POST',
                         mode: 'no-cors',
                        headers: {
                        'Content-Type': 'application/json',
                         },
                       body: JSON.stringify(data)
                      })
                      .then(response => response.json())
                      .then(data => {
                          if (data.result === 'success') {
                              console.log('Data berhasil dikirim ke spreadsheet.');
                           } else {
                               console.error('Error mengirim data ke spreadsheet:', data.error);
                           }
                         })
                           .catch(error => {
                           console.error('Ada kesalahan saat mengirim data:', error);
                           });
           
    });
        confirmPaymentButton.addEventListener('click', function() {
         window.open(`https://wa.me/${waNumber}?text=Halo, saya sudah melakukan pembayaran!`, '_blank');
        });
});