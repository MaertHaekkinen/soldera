# Generated by Django 5.2.3 on 2025-07-01 11:27

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AuctionResults',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('number_of_participants', models.IntegerField()),
                ('md5_hash', models.CharField(max_length=32, unique=True)),
            ],
            options={
                'ordering': ['-date', '-id'],
            },
        ),
        migrations.CreateModel(
            name='Auction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('region', models.CharField()),
                ('technology', models.CharField()),
                ('volume_auctioned', models.IntegerField()),
                ('average_price', models.FloatField()),
                ('volume_sold', models.IntegerField()),
                ('number_of_winners', models.IntegerField()),
                ('auction_results',
                 models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='auctions',
                                   to='soldera.auctionresults')),
            ],
            options={
                'ordering': ['region', 'technology', '-id'],
            },
        ),
    ]
